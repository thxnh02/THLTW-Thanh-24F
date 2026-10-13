<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\ProductVariant;
use App\Models\PromotionUsage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutService
{
    private bool $reusedExistingOrder = false;

    public function reusedExistingOrder(): bool
    {
        return $this->reusedExistingOrder;
    }

    public function createOrder(array $validated, ?int $userId, string $ipAddress, CartQuoteService $cartQuoteService, VnpayService $vnpayService): Order
    {
        $existingOrder = Order::query()
            ->with(['items', 'payment'])
            ->where('idempotency_key', $validated['idempotency_key'])
            ->first();

        if ($existingOrder) {
            $this->reusedExistingOrder = true;

            return $existingOrder;
        }

        return DB::transaction(function () use ($validated, $userId, $ipAddress, $cartQuoteService, $vnpayService): Order {
            $customerEmail = strtolower(trim($validated['customer']['email']));
            $quote = $cartQuoteService->buildQuote(
                $validated['items'],
                $validated['promotion_code'] ?? null,
                $userId,
                $customerEmail,
                true,
                $validated['shipping_method_id'] ?? null
            );

            if (($validated['promotion_code'] ?? null) && ! $quote['promotion']) {
                abort(409, 'Mã khuyến mãi không hợp lệ hoặc đã hết lượt sử dụng.');
            }

            $order = Order::create([
                'user_id' => $userId,
                'code' => $this->generateOrderCode(),
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'payment_method' => $validated['payment_method'],
                'customer_name' => $validated['customer']['name'],
                'customer_email' => $customerEmail,
                'customer_phone' => $validated['customer']['phone'],
                'shipping_address' => $validated['customer']['address'],
                'shipping_method_id' => $quote['shipping_method']['id'] ?? null,
                'shipping_method_name' => $quote['shipping_method']['name'] ?? null,
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
                    abort(409, 'Sản phẩm '.$variant->sku.' không đủ tồn kho.');
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
                    'user_id' => $userId,
                    'order_id' => $order->id,
                    'email' => $customerEmail,
                ]);
            }

            if ($userId) {
                Cart::query()->where('user_id', $userId)->delete();
            }

            $order->load(['items', 'payment']);

            if ($validated['payment_method'] === 'vnpay') {
                $order->payment_url = $vnpayService->createPaymentUrl($order, $ipAddress);
            }

            return $order;
        });
    }

    private function generateOrderCode(): string
    {
        do {
            $code = 'ORD-'.now()->format('ymd').'-'.Str::upper(Str::random(6));
        } while (Order::query()->where('code', $code)->exists());

        return $code;
    }
}
