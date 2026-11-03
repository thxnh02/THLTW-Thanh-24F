<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Models\Product;
use App\Models\User;
use App\Support\CommerceNotification;
use App\Support\CommercePrice;
use App\Support\VnPayGateway;
use App\Support\VnPayReconciler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CustomerOrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return OrderResource::collection(Order::query()->where('user_id', $request->user()->id)
            ->with('items')->orderByDesc('id')->paginate(10));
    }

    public function show(Request $request, int $order): OrderResource
    {
        return new OrderResource($this->owned($request, $order)->load(['items', 'paymentAttempts']));
    }

    public function checkout(Request $request, VnPayGateway $gateway): JsonResponse
    {
        $data = $request->validate([
            'address_id' => ['required', 'integer', 'min:1'],
            'payment_method' => ['required', 'in:cod,vnpay'],
            'idempotency_key' => ['required', 'uuid'],
            'customer_note' => ['nullable', 'string', 'max:500'],
            'buy_now_product_id' => ['nullable', 'integer', 'min:1'],
            'buy_now_quantity' => ['required_with:buy_now_product_id', 'integer', 'min:1', 'max:20'],
        ]);
        if ($data['payment_method'] === 'cod' && ! config('commerce.cod_demo_enabled')) {
            throw ValidationException::withMessages(['payment_method' => 'COD mô phỏng chưa được bật trên máy chủ.']);
        }
        if ($data['payment_method'] === 'vnpay' && ! $gateway->configured()) {
            throw ValidationException::withMessages(['payment_method' => 'VNPay sandbox chưa được cấu hình.']);
        }

        $order = DB::transaction(function () use ($request, $data, $gateway): Order {
            User::query()->whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            $previous = Order::query()->where('user_id', $request->user()->id)->where('idempotency_key', $data['idempotency_key'])->first();
            if ($previous) {
                return $previous;
            }
            $address = $request->user()->addresses()->whereKey($data['address_id'])->firstOrFail();
            $buyNow = ! empty($data['buy_now_product_id']);
            $cart = $buyNow
                ? collect([(object) ['product_id' => (int) $data['buy_now_product_id'], 'quantity' => (int) $data['buy_now_quantity']]])
                : CartItem::query()->where('user_id', $request->user()->id)->orderBy('product_id')->get();
            if ($cart->isEmpty()) {
                throw ValidationException::withMessages(['cart' => 'Giỏ hàng đang trống.']);
            }
            $products = CommercePrice::visible()->whereIn('products.id', $cart->pluck('product_id'))
                ->orderBy('products.id')->lockForUpdate()->get()->keyBy('id');
            $lines = [];
            $subtotal = 0;
            foreach ($cart as $item) {
                $product = $products->get($item->product_id);
                if (! $product || ($product->stock_quantity !== null && $product->stock_quantity < $item->quantity)) {
                    throw ValidationException::withMessages(['cart' => 'Một sản phẩm không còn bán hoặc không đủ số lượng. Hãy kiểm tra giỏ hàng.']);
                }
                $price = CommercePrice::productVnd($product);
                $total = $price * $item->quantity;
                $subtotal += $total;
                if ($subtotal > 900000000000) {
                    throw ValidationException::withMessages(['cart' => 'Tổng tiền vượt giới hạn.']);
                }
                $lines[] = ['product_id' => $product->id, 'product_name' => $product->name,
                    'product_slug' => $product->slug, 'product_image' => $product->image,
                    'unit_price_vnd' => $price, 'quantity' => $item->quantity, 'line_total_vnd' => $total];
                if ($product->stock_quantity !== null) {
                    $product->stock_quantity -= $item->quantity;
                    $product->save();
                }
            }
            $shipping = (int) config('commerce.shipping_fee_vnd', 0);
            if ($data['payment_method'] === 'vnpay') {
                $gateway->assertAmount($subtotal + $shipping);
            }
            $snapshot = $address->only(['recipient_name', 'recipient_phone', 'province', 'ward', 'district', 'street', 'detail', 'delivery_note']);
            $order = new Order;
            $order->forceFill([
                'user_id' => $request->user()->id, 'order_code' => (string) Str::uuid(),
                'status' => 'pending', 'shipping_snapshot' => $snapshot, 'subtotal_vnd' => $subtotal,
                'shipping_fee_vnd' => $shipping, 'grand_total_vnd' => $subtotal + $shipping,
                'payment_method' => $data['payment_method'],
                'payment_status' => $data['payment_method'] === 'cod' ? 'demo_paid' : 'pending',
                'idempotency_key' => $data['idempotency_key'], 'customer_note' => $data['customer_note'] ?? null,
            ])->save();
            $order->items()->createMany($lines);
            if ($data['payment_method'] === 'vnpay') {
                $created = now();
                $order->paymentAttempts()->create(['provider' => 'vnpay', 'txn_ref' => (string) Str::ulid(),
                    'amount_vnd' => $subtotal + $shipping, 'state' => 'pending',
                    'pay_created_at' => $created, 'pay_expires_at' => $created->copy()->addMinutes(15)]);
                CommerceNotification::order($order, 'pending', 'Đơn hàng đang chờ thanh toán', 'Đang chờ xác nhận thanh toán VNPay.');
            } else {
                CommerceNotification::order($order, 'demo_paid', 'Đặt hàng thành công', 'Đặt hàng và thanh toán thành công (mô phỏng).');
            }
            if (! $buyNow) {
                CartItem::query()->where('user_id', $request->user()->id)->whereIn('product_id', $cart->pluck('product_id'))->delete();
            }

            return $order;
        });

        $order->load(['items', 'paymentAttempts']);
        $attempt = $order->paymentAttempts->where('state', 'pending')->last();

        return response()->json(['data' => ['order' => new OrderResource($order),
            'payment_url' => $attempt && $attempt->pay_expires_at?->isFuture() ? $gateway->payUrl($attempt, $request->ip()) : null]], 201);
    }

    public function retry(Request $request, int $order, VnPayGateway $gateway, VnPayReconciler $reconciler): JsonResponse
    {
        if (! $gateway->configured()) {
            throw ValidationException::withMessages(['payment' => 'VNPay sandbox chưa được cấu hình.']);
        }
        $current = $this->owned($request, $order);
        $last = $current->paymentAttempts()->latest('id')->first();
        if ($last && in_array($last->state, ['pending', 'needs_review'], true)
            && (! $last->pay_expires_at || $last->pay_expires_at->isPast() || $last->state === 'needs_review')) {
            $reconciler->reconcile($last->id);
        }
        $attempt = DB::transaction(function () use ($request, $order): PaymentAttempt {
            $owned = Order::query()->where('user_id', $request->user()->id)->whereKey($order)->lockForUpdate()->firstOrFail();
            if ($owned->payment_method !== 'vnpay' || $owned->payment_review_required
                || in_array($owned->payment_status, ['paid', 'needs_review'], true) || $owned->status !== 'pending') {
                throw ValidationException::withMessages(['payment' => 'Đơn hàng không thể thanh toán lại.']);
            }
            app(VnPayGateway::class)->assertAmount((int) $owned->grand_total_vnd);
            $latest = $owned->paymentAttempts()->latest('id')->lockForUpdate()->first();
            if ($latest && in_array($latest->state, ['pending', 'needs_review'], true)) {
                if ($latest->state === 'pending' && $latest->pay_expires_at?->isFuture()) {
                    return $latest;
                }
                throw ValidationException::withMessages(['payment' => 'Giao dịch cũ chưa được xác nhận là thất bại. Vui lòng chờ đối soát hoặc liên hệ quản trị viên; không thể tạo liên kết mới lúc này.']);
            }
            $created = now();
            $attempt = $owned->paymentAttempts()->create(['provider' => 'vnpay', 'txn_ref' => (string) Str::ulid(),
                'amount_vnd' => $owned->grand_total_vnd, 'state' => 'pending',
                'pay_created_at' => $created, 'pay_expires_at' => $created->copy()->addMinutes(15)]);
            $owned->forceFill(['payment_status' => 'pending'])->save();
            CommerceNotification::order($owned, 'retry:'.$attempt->id, 'Đang chờ thanh toán', 'Đang chờ xác nhận thanh toán VNPay.');

            return $attempt;
        });

        return response()->json(['data' => ['payment_url' => $gateway->payUrl($attempt, $request->ip())]]);
    }

    public function cancel(Request $request, int $order): OrderResource
    {
        $owned = DB::transaction(function () use ($request, $order): Order {
            $owned = Order::query()->where('user_id', $request->user()->id)->whereKey($order)->lockForUpdate()->firstOrFail();
            if ($owned->status !== 'pending' || $owned->payment_method !== 'cod' || $owned->payment_status !== 'demo_paid') {
                throw ValidationException::withMessages(['order' => 'Không thể hủy đơn này.']);
            }
            $owned->status = 'cancelled';
            $owned->stock_restored_at = now();
            $owned->save();
            foreach ($owned->items as $item) {
                if ($item->product_id) {
                    Product::withTrashed()->whereKey($item->product_id)->whereNotNull('stock_quantity')->increment('stock_quantity', $item->quantity);
                }
            }
            CommerceNotification::order($owned, 'cancelled', 'Đơn hàng đã hủy', 'Đơn hàng COD mô phỏng đã được hủy.');

            return $owned;
        });

        return new OrderResource($owned->load('items'));
    }

    private function owned(Request $request, int $order): Order
    {
        return Order::query()->where('user_id', $request->user()->id)->whereKey($order)->firstOrFail();
    }
}
