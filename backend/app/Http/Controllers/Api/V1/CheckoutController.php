<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\ProductVariant;
use App\Models\PromotionUsage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpKernel\Exception\HttpException;

class CheckoutController extends Controller
{
    use ApiResponses;

    public function store(Request $request, CartController $cartController): JsonResponse
    {
        $validated = $request->validate([
            'customer.name' => ['required', 'string', 'max:120'],
            'customer.email' => ['required', 'email', 'max:160'],
            'customer.phone' => ['required', 'string', 'max:30'],
            'customer.address' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:1000'],
            'payment_method' => ['required', 'in:cod,vnpay'],
            'promotion_code' => ['nullable', 'string', 'max:80'],
            'idempotency_key' => ['required', 'string', 'max:120'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $existingOrder = Order::query()
            ->with(['items', 'payment'])
            ->where('idempotency_key', $validated['idempotency_key'])
            ->first();

        if ($existingOrder) {
            return $this->success($existingOrder, 'Don hang da ton tai.');
        }

        try {
            $user = $this->userFromBearerToken($request);
            $order = DB::transaction(function () use ($validated, $cartController, $user): Order {
                $customerEmail = strtolower(trim($validated['customer']['email']));
                $quote = $cartController->buildQuote(
                    $validated['items'],
                    $validated['promotion_code'] ?? null,
                    $user?->id,
                    $customerEmail,
                    true
                );

                if (($validated['promotion_code'] ?? null) && ! $quote['promotion']) {
                    abort(409, 'Ma khuyen mai khong hop le hoac da het luot su dung.');
                }

                $order = Order::create([
                    'user_id' => $user?->id,
                    'code' => $this->generateOrderCode(),
                    'status' => 'pending',
                    'payment_status' => 'unpaid',
                    'payment_method' => $validated['payment_method'],
                    'customer_name' => $validated['customer']['name'],
                    'customer_email' => $customerEmail,
                    'customer_phone' => $validated['customer']['phone'],
                    'shipping_address' => $validated['customer']['address'],
                    'note' => $validated['note'] ?? null,
                    'subtotal' => $quote['subtotal'],
                    'discount_total' => $quote['discount_total'],
                    'shipping_fee' => $quote['shipping_fee'],
                    'grand_total' => $quote['grand_total'],
                    'promotion_code' => $quote['promotion']['code'] ?? null,
                    'idempotency_key' => $validated['idempotency_key'],
                ]);

                foreach ($quote['items'] as $line) {
                    $variant = ProductVariant::query()->with('product')->lockForUpdate()->findOrFail($line['variant_id']);

                    if (! $variant->active || $variant->stock_quantity < $line['quantity']) {
                        abort(409, 'San pham '.$variant->sku.' khong du ton kho.');
                    }

                    $variant->decrement('stock_quantity', $line['quantity']);
                    $variant->product()->increment('sold_count', $line['quantity']);
                    $variant->refresh();

                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $variant->product_id,
                        'product_variant_id' => $variant->id,
                        'product_name' => $variant->product->name,
                        'variant_name' => $variant->name,
                        'sku' => $variant->sku,
                        'unit_price' => $line['unit_price'],
                        'quantity' => $line['quantity'],
                        'subtotal' => $line['subtotal'],
                    ]);

                    InventoryMovement::create([
                        'product_variant_id' => $variant->id,
                        'quantity_change' => -$line['quantity'],
                        'balance_after' => $variant->stock_quantity,
                        'reason' => 'checkout',
                        'source_type' => Order::class,
                        'source_id' => $order->id,
                    ]);
                }

                Payment::create([
                    'order_id' => $order->id,
                    'method' => $validated['payment_method'],
                    'status' => 'pending',
                    'amount' => $quote['grand_total'],
                ]);

                if ($order->promotion_code) {
                    DB::table('promotions')->where('code', $order->promotion_code)->increment('used_count');
                    PromotionUsage::create([
                        'promotion_id' => $quote['promotion']['id'],
                        'user_id' => $user?->id,
                        'order_id' => $order->id,
                        'email' => $customerEmail,
                    ]);
                }

                if ($user) {
                    Cart::query()->where('user_id', $user->id)->delete();
                }

                $order->load(['items', 'payment']);

                if ($validated['payment_method'] === 'vnpay') {
                    $order->payment_url = $this->buildVnpayUrl($order, request()->ip() ?: '127.0.0.1');
                }

                return $order;
            });
        } catch (HttpException $exception) {
            return $this->error($exception->getMessage(), $exception->getStatusCode());
        }

        return $this->success($order, 'Dat hang thanh cong.', status: 201);
    }

    private function generateOrderCode(): string
    {
        do {
            $code = 'ORD-'.now()->format('ymd').'-'.Str::upper(Str::random(6));
        } while (Order::query()->where('code', $code)->exists());

        return $code;
    }

    private function buildVnpayUrl(Order $order, string $ipAddress): string
    {
        $tmnCode = config('services.vnpay.tmn_code');
        $secret = config('services.vnpay.hash_secret');
        $paymentUrl = config('services.vnpay.url');

        if (! $tmnCode || ! $secret || ! $paymentUrl) {
            abort(409, 'VNPay chua duoc cau hinh.');
        }

        $params = [
            'vnp_Version' => '2.1.0',
            'vnp_Command' => 'pay',
            'vnp_TmnCode' => $tmnCode,
            'vnp_Amount' => (int) round((float) $order->grand_total * 100),
            'vnp_CurrCode' => 'VND',
            'vnp_TxnRef' => $order->code,
            'vnp_OrderInfo' => 'Thanh toan don hang '.$order->code,
            'vnp_OrderType' => 'other',
            'vnp_Locale' => 'vn',
            'vnp_ReturnUrl' => config('services.vnpay.return_url'),
            'vnp_IpAddr' => $ipAddress,
            'vnp_CreateDate' => now()->format('YmdHis'),
            'vnp_ExpireDate' => now()->addMinutes(15)->format('YmdHis'),
        ];

        ksort($params);
        $hashData = http_build_query($params, '', '&', PHP_QUERY_RFC3986);
        $params['vnp_SecureHash'] = hash_hmac('sha512', $hashData, $secret);

        return $paymentUrl.'?'.http_build_query($params, '', '&', PHP_QUERY_RFC3986);
    }

    private function userFromBearerToken(Request $request): ?User
    {
        $bearerToken = $request->bearerToken();

        if (! $bearerToken) {
            return null;
        }

        $accessToken = PersonalAccessToken::findToken($bearerToken);
        $user = $accessToken?->tokenable;

        if (! $user instanceof User || $user->isLocked()) {
            return null;
        }

        return $user;
    }
}
