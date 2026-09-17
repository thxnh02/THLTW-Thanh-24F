<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Concerns\RendersOrderInvoice;
use App\Http\Controllers\Controller;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class AccountOrderController extends Controller
{
    use ApiResponses;
    use RendersOrderInvoice;

    public function index(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate((int) $request->integer('per_page', 10));

        return $this->success($orders);
    }

    public function show(Request $request, string $code): JsonResponse
    {
        $order = $this->orderForUser($request, $code)->load(['items', 'payment']);

        return $this->success($order);
    }

    public function invoice(Request $request, string $code): Response
    {
        return response($this->renderInvoiceHtml($this->orderForUser($request, $code)), 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }

    public function invoicePdf(Request $request, string $code): Response
    {
        $order = $this->orderForUser($request, $code);

        return response($this->renderInvoicePdf($order), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$order->code.'.pdf"',
        ]);
    }

    public function cancel(Request $request, string $code): JsonResponse
    {
        $order = $this->orderForUser($request, $code)->load('items');

        if ($order->status !== 'pending') {
            return $this->error('Chi co the huy don hang dang cho xac nhan.', 409);
        }

        DB::transaction(function () use ($order, $request): void {
            $lockedOrder = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
            $fromStatus = $lockedOrder->status;

            if ($lockedOrder->stock_restored_at === null) {
                foreach ($lockedOrder->items as $item) {
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
                        'reason' => 'order_cancel',
                        'source_type' => Order::class,
                        'source_id' => $lockedOrder->id,
                        'created_by' => $request->user()->id,
                    ]);
                }

                $lockedOrder->stock_restored_at = now();
            }

            $lockedOrder->status = 'canceled';
            $lockedOrder->save();

            OrderStatusHistory::create([
                'order_id' => $lockedOrder->id,
                'changed_by' => $request->user()->id,
                'from_status' => $fromStatus,
                'to_status' => 'canceled',
                'note' => 'Member canceled order',
            ]);
        });

        return $this->success($order->refresh()->load(['items', 'payment']), 'Da huy don hang.');
    }

    private function orderForUser(Request $request, string $code): Order
    {
        return Order::query()
            ->where('user_id', $request->user()->id)
            ->where('code', $code)
            ->firstOrFail();
    }
}
