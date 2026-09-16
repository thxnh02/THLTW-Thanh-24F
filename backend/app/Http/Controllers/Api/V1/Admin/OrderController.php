<?php

namespace App\Http\Controllers\Api\V1\Admin;

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
use Symfony\Component\HttpFoundation\StreamedResponse;

class OrderController extends Controller
{
    use ApiResponses;
    use RendersOrderInvoice;

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

    public function index(Request $request): JsonResponse
    {
        $query = Order::query()->withCount('items')->latest();

        if ($request->filled('q')) {
            $keyword = '%'.$request->string('q')->trim()->toString().'%';
            $query->where(function ($query) use ($keyword): void {
                $query->where('code', 'like', $keyword)
                    ->orWhere('customer_name', 'like', $keyword)
                    ->orWhere('customer_email', 'like', $keyword)
                    ->orWhere('customer_phone', 'like', $keyword);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date('date_to'));
        }

        return $this->success($query->paginate((int) $request->integer('per_page', 15)));
    }

    public function show(Order $order): JsonResponse
    {
        return $this->success($order->load(['items', 'payment', 'histories']));
    }

    public function export(Request $request): StreamedResponse
    {
        $query = Order::query()->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->streamDownload(function () use ($query): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['code', 'customer', 'email', 'phone', 'status', 'payment_status', 'payment_method', 'grand_total', 'created_at']);

            $query->chunk(200, function ($orders) use ($handle): void {
                foreach ($orders as $order) {
                    fputcsv($handle, [
                        $order->code,
                        $order->customer_name,
                        $order->customer_email,
                        $order->customer_phone,
                        $order->status,
                        $order->payment_status,
                        $order->payment_method,
                        $order->grand_total,
                        $order->created_at?->toDateTimeString(),
                    ]);
                }
            });

            fclose($handle);
        }, 'orders.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function invoice(Order $order): Response
    {
        return response($this->renderInvoiceHtml($order), 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,confirmed,shipping,completed,canceled'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($order->status === $validated['status']) {
            return $this->success($order->load(['items', 'payment', 'histories']), 'Trang thai khong thay doi.');
        }

        if (! in_array($validated['status'], $this->allowedTransitions[$order->status] ?? [], true)) {
            return $this->error('Trang thai don hang khong hop le.', 409);
        }

        DB::transaction(function () use ($order, $request, $validated): void {
            $lockedOrder = Order::query()->with('items')->whereKey($order->id)->lockForUpdate()->firstOrFail();
            $fromStatus = $lockedOrder->status;
            $toStatus = $validated['status'];

            if (! in_array($toStatus, $this->allowedTransitions[$fromStatus] ?? [], true)) {
                abort(409, 'Trang thai don hang khong hop le.');
            }

            if ($toStatus === 'canceled') {
                $this->restoreStockOnce($lockedOrder, $request->user()->id);
            }

            $lockedOrder->status = $toStatus;

            if ($toStatus === 'completed' && $lockedOrder->payment_method === 'cod') {
                $lockedOrder->payment_status = 'paid';
                $lockedOrder->payment?->update(['status' => 'paid']);
            }

            $lockedOrder->save();

            OrderStatusHistory::create([
                'order_id' => $lockedOrder->id,
                'changed_by' => $request->user()->id,
                'from_status' => $fromStatus,
                'to_status' => $toStatus,
                'note' => $validated['note'] ?? null,
            ]);
        });

        return $this->success($order->refresh()->load(['items', 'payment', 'histories']), 'Da cap nhat trang thai don hang.');
    }

    private function restoreStockOnce(Order $order, int $adminId): void
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
                'reason' => 'admin_order_cancel',
                'source_type' => Order::class,
                'source_id' => $order->id,
                'created_by' => $adminId,
            ]);
        }

        $order->stock_restored_at = now();
    }
}
