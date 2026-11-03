<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Product;
use App\Support\VnPayReconciler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminPaymentController extends Controller
{
    public function reconcile(Request $request, Order $order, VnPayReconciler $reconciler): JsonResponse
    {
        $data = $request->validate(['attempt_id' => ['nullable', 'integer', 'min:1']]);
        if ($order->payment_method !== 'vnpay') {
            throw ValidationException::withMessages(['payment' => 'Đơn này không thanh toán bằng VNPay.']);
        }
        $attempt = $order->paymentAttempts()->whereKey($data['attempt_id'] ?? $order->paymentAttempts()->max('id'))->firstOrFail();
        $outcome = $reconciler->reconcile($attempt->id, $request->user()->id);

        return response()->json(['data' => ['outcome' => $outcome,
            'order' => new OrderResource($order->fresh()->load(['user', 'items', 'paymentAttempts', 'paymentEvents']))]]);
    }

    // Stock is released only after every attempt has a verified terminal failure.
    public function closeUnpaid(Request $request, Order $order): OrderResource
    {
        $data = $request->validate(['reason' => ['required', 'string', 'min:10', 'max:120']]);
        $closed = DB::transaction(function () use ($request, $order, $data): Order {
            $locked = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
            $attempts = $locked->paymentAttempts()->lockForUpdate()->get();
            if ($locked->payment_method !== 'vnpay' || $locked->status !== 'pending'
                || $locked->payment_status !== 'failed' || $locked->stock_restored_at
                || $attempts->isEmpty() || $attempts->contains(fn ($attempt) => $attempt->state !== 'failed')) {
                throw ValidationException::withMessages(['payment' => 'Chỉ đóng đơn VNPay khi tất cả giao dịch đã được xác nhận thất bại.']);
            }
            $locked->forceFill(['status' => 'cancelled', 'stock_restored_at' => now()])->save();
            foreach ($locked->items as $item) {
                if ($item->product_id) {
                    Product::withTrashed()->whereKey($item->product_id)->whereNotNull('stock_quantity')->increment('stock_quantity', $item->quantity);
                }
            }
            DB::table('payment_reconciliation_events')->insert([
                'order_id' => $locked->id, 'payment_attempt_id' => $attempts->last()->id,
                'actor_user_id' => $request->user()->id, 'source' => 'admin', 'outcome' => 'closed_unpaid',
                'reason' => trim($data['reason']), 'created_at' => now(),
            ]);

            return $locked;
        });

        return new OrderResource($closed->load(['user', 'items', 'paymentAttempts', 'paymentEvents']));
    }
}
