<?php

namespace App\Services;

use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

class OrderStatusService
{
    /**
     * @var array<string, array<int, string>>
     */
    private array $allowedTransitions = [
        'pending' => ['confirmed', 'canceled'],
        'confirmed' => ['shipping', 'canceled'],
        'shipping' => ['completed', 'canceled'],
        'completed' => [],
        'canceled' => [],
    ];

    /**
     * @return array{order: Order, changed: bool}
     */
    public function update(Order $order, array $validated, int $adminId): array
    {
        if ($order->status === $validated['status']) {
            return [
                'order' => $order->load(['items', 'payment', 'histories']),
                'changed' => false,
            ];
        }

        if (! in_array($validated['status'], $this->allowedTransitions[$order->status] ?? [], true)) {
            abort(409, 'Trạng thái đơn hàng không hợp lệ.');
        }

        DB::transaction(function () use ($order, $validated, $adminId): void {
            $lockedOrder = Order::query()->with(['items', 'payment'])->whereKey($order->id)->lockForUpdate()->firstOrFail();
            $fromStatus = $lockedOrder->status;
            $toStatus = $validated['status'];

            if (! in_array($toStatus, $this->allowedTransitions[$fromStatus] ?? [], true)) {
                abort(409, 'Trạng thái đơn hàng không hợp lệ.');
            }

            if ($toStatus === 'canceled') {
                $this->restoreStockOnce($lockedOrder, $adminId, 'admin_order_cancel');
            }

            $lockedOrder->status = $toStatus;

            if ($toStatus === 'completed' && $lockedOrder->payment_method === 'cod') {
                $lockedOrder->payment_status = 'paid';
                $lockedOrder->payment?->update(['status' => 'paid']);
            }

            if ($toStatus === 'shipping') {
                $lockedOrder->shipping_carrier = $validated['shipping_carrier'] ?? $lockedOrder->shipping_carrier;
                $lockedOrder->tracking_code = $validated['tracking_code'] ?? $lockedOrder->tracking_code;
                $lockedOrder->shipped_at ??= now();
            }

            if ($toStatus === 'completed') {
                $lockedOrder->delivered_at ??= now();
            }

            $lockedOrder->save();

            OrderStatusHistory::create([
                'order_id' => $lockedOrder->id,
                'changed_by' => $adminId,
                'from_status' => $fromStatus,
                'to_status' => $toStatus,
                'note' => $validated['note'] ?? null,
            ]);
        });

        return [
            'order' => $order->refresh()->load(['items', 'payment', 'histories']),
            'changed' => true,
        ];
    }

    public function cancelForMember(Order $order, int $userId): Order
    {
        if ($order->status !== 'pending') {
            abort(409, 'Chỉ có thể hủy đơn hàng đang chờ xác nhận.');
        }

        DB::transaction(function () use ($order, $userId): void {
            $lockedOrder = Order::query()->with('items')->whereKey($order->id)->lockForUpdate()->firstOrFail();
            $fromStatus = $lockedOrder->status;

            if ($fromStatus !== 'pending') {
                abort(409, 'Chỉ có thể hủy đơn hàng đang chờ xác nhận.');
            }

            $this->restoreStockOnce($lockedOrder, $userId);
            $lockedOrder->status = 'canceled';
            $lockedOrder->save();

            OrderStatusHistory::create([
                'order_id' => $lockedOrder->id,
                'changed_by' => $userId,
                'from_status' => $fromStatus,
                'to_status' => 'canceled',
                'note' => 'Member canceled order',
            ]);
        });

        return $order->refresh()->load(['items', 'payment']);
    }

    public function restoreStockOnce(Order $order, int $actorId, string $reason = 'order_cancel'): void
    {
        if ($order->stock_restored_at !== null) {
            return;
        }

        foreach ($order->items as $item) {
            if (! $item->product_variant_id) {
                continue;
            }

            $variant = ProductVariant::query()->lockForUpdate()->find($item->product_variant_id);

            if (! $variant) {
                continue;
            }

            $variant->increment('stock_quantity', $item->quantity);
            $variant->refresh();

            InventoryMovement::create([
                'product_variant_id' => $variant->id,
                'quantity_change' => $item->quantity,
                'balance_after' => $variant->stock_quantity,
                'reason' => $reason,
                'source_type' => Order::class,
                'source_id' => $order->id,
                'created_by' => $actorId,
            ]);
        }

        $order->stock_restored_at = now();
    }
}
