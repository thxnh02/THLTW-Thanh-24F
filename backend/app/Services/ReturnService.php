<?php

namespace App\Services;

use App\Models\CustomerNotification;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\ReturnRequest;
use App\Models\ReturnRequestItem;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReturnService
{
    /**
     * @param  array{order_code:string, reason:string, description?:?string, items:array<int, array{order_item_id:int, quantity:int, reason?:?string, condition_note?:?string}>}  $data
     */
    public function createForUser(User $user, array $data): ReturnRequest
    {
        return DB::transaction(function () use ($user, $data): ReturnRequest {
            $order = Order::query()
                ->with('items')
                ->where('user_id', $user->id)
                ->where('code', $data['order_code'])
                ->lockForUpdate()
                ->firstOrFail();

            $this->assertOrderEligible($order);

            $returnRequest = ReturnRequest::create([
                'order_id' => $order->id,
                'user_id' => $user->id,
                'code' => $this->generateCode(),
                'reason' => $data['reason'],
                'description' => $data['description'] ?? null,
                'status' => 'requested',
                'refund_status' => 'none',
                'requested_at' => now(),
            ]);

            foreach ($data['items'] as $itemData) {
                $orderItem = $order->items->firstWhere('id', (int) $itemData['order_item_id']);

                if (! $orderItem) {
                    abort(422, 'San pham hoan tra khong thuoc don hang.');
                }

                $quantity = (int) $itemData['quantity'];
                $activeQuantity = ReturnRequestItem::query()
                    ->where('order_item_id', $orderItem->id)
                    ->whereHas('returnRequest', fn ($query) => $query->whereIn('status', ['requested', 'approved', 'received']))
                    ->sum('quantity');

                if ($quantity < 1 || ($activeQuantity + $quantity) > $orderItem->quantity) {
                    abort(422, 'So luong hoan tra vuot qua so luong da mua.');
                }

                ReturnRequestItem::create([
                    'return_request_id' => $returnRequest->id,
                    'order_item_id' => $orderItem->id,
                    'quantity' => $quantity,
                    'reason' => $itemData['reason'] ?? null,
                    'condition_note' => $itemData['condition_note'] ?? null,
                ]);
            }

            return $returnRequest->load(['order', 'items.orderItem']);
        });
    }

    /**
     * @param  array{status?:string, refund_status?:string, admin_note?:?string}  $data
     */
    public function updateByAdmin(ReturnRequest $returnRequest, User $admin, array $data): ReturnRequest
    {
        return DB::transaction(function () use ($returnRequest, $admin, $data): ReturnRequest {
            $locked = ReturnRequest::query()
                ->with(['items.orderItem'])
                ->whereKey($returnRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (isset($data['status']) && $data['status'] !== $locked->status) {
                $this->applyStatus($locked, $data['status'], $admin);
            }

            if (isset($data['refund_status']) && $data['refund_status'] !== $locked->refund_status) {
                $this->applyRefundStatus($locked, $data['refund_status']);
            }

            if (array_key_exists('admin_note', $data)) {
                $locked->admin_note = $data['admin_note'];
            }

            $locked->save();

            return $locked->refresh()->load(['order', 'user', 'items.orderItem']);
        });
    }

    private function assertOrderEligible(Order $order): void
    {
        if ($order->status !== 'completed') {
            abort(409, 'Chi don hang hoan thanh moi duoc yeu cau doi tra.');
        }

        $windowDays = (int) (Setting::query()->where('key', 'return_window_days')->value('value') ?? 7);

        if ($order->created_at?->lt(now()->subDays($windowDays))) {
            abort(409, 'Don hang da qua thoi han doi tra.');
        }
    }

    private function applyStatus(ReturnRequest $returnRequest, string $status, User $admin): void
    {
        $allowed = [
            'requested' => ['approved', 'rejected', 'canceled'],
            'approved' => ['received', 'canceled'],
            'received' => ['completed'],
            'rejected' => [],
            'completed' => [],
            'canceled' => [],
        ];

        if (! in_array($status, $allowed[$returnRequest->status] ?? [], true)) {
            abort(409, 'Trang thai doi tra khong hop le.');
        }

        $returnRequest->status = $status;

        if ($status === 'approved') {
            $returnRequest->approved_at = now();
            $returnRequest->refund_status = 'pending';
            $this->notifyCustomer($returnRequest, 'return_status', 'Yeu cau doi tra da duoc chap thuan.', 'Yeu cau '.$returnRequest->code.' da duoc chap thuan.');
        } elseif ($status === 'rejected') {
            $returnRequest->rejected_at = now();
            $returnRequest->refund_status = 'none';
            $this->notifyCustomer($returnRequest, 'return_status', 'Yeu cau doi tra da bi tu choi.', 'Yeu cau '.$returnRequest->code.' da bi tu choi.');
        } elseif ($status === 'received') {
            $returnRequest->received_at = now();
            $this->restoreStockOnce($returnRequest, $admin);
        } elseif ($status === 'completed') {
            $returnRequest->completed_at = now();
            $returnRequest->refund_status = 'refunded';
            $returnRequest->refunded_at ??= now();
            $this->notifyCustomer($returnRequest, 'refund_status', 'Hoan tien da hoan tat.', 'Yeu cau '.$returnRequest->code.' da duoc hoan tien.');
        }
    }

    private function applyRefundStatus(ReturnRequest $returnRequest, string $refundStatus): void
    {
        $allowed = [
            'none' => ['pending'],
            'pending' => ['refunded', 'failed'],
            'failed' => ['pending'],
            'refunded' => [],
        ];

        if (! in_array($refundStatus, $allowed[$returnRequest->refund_status] ?? [], true)) {
            abort(409, 'Trang thai hoan tien khong hop le.');
        }

        $returnRequest->refund_status = $refundStatus;

        if ($refundStatus === 'refunded') {
            $returnRequest->refunded_at = now();
            $this->notifyCustomer($returnRequest, 'refund_status', 'Hoan tien da hoan tat.', 'Yeu cau '.$returnRequest->code.' da duoc hoan tien.');
        }
    }

    private function notifyCustomer(ReturnRequest $returnRequest, string $type, string $title, string $message): void
    {
        if (! $returnRequest->user_id) {
            return;
        }

        CustomerNotification::create([
            'user_id' => $returnRequest->user_id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'action_url' => '/account/returns/'.$returnRequest->code,
        ]);
    }

    private function restoreStockOnce(ReturnRequest $returnRequest, User $admin): void
    {
        if ($returnRequest->stock_restored_at !== null) {
            return;
        }

        foreach ($returnRequest->items as $item) {
            $orderItem = $item->orderItem;

            if (! $orderItem?->product_variant_id) {
                continue;
            }

            $variant = ProductVariant::query()->lockForUpdate()->find($orderItem->product_variant_id);

            if (! $variant) {
                continue;
            }

            $variant->increment('stock_quantity', $item->quantity);
            $variant->refresh();

            InventoryMovement::create([
                'product_variant_id' => $variant->id,
                'quantity_change' => $item->quantity,
                'balance_after' => $variant->stock_quantity,
                'reason' => 'return_received',
                'source_type' => ReturnRequest::class,
                'source_id' => $returnRequest->id,
                'created_by' => $admin->id,
            ]);
        }

        $returnRequest->stock_restored_at = now();
    }

    private function generateCode(): string
    {
        do {
            $code = 'RET-'.now()->format('ymd').'-'.Str::upper(Str::random(6));
        } while (ReturnRequest::query()->where('code', $code)->exists());

        return $code;
    }
}
