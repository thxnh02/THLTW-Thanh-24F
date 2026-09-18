<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    use ApiResponses;

    public function overview(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('reports'), 403);

        [$from, $to] = $this->dateRange($request);
        $orders = $this->ordersInRange($from, $to);
        $validOrders = (clone $orders)->where('status', '!=', 'canceled');
        $completedOrders = (clone $orders)->where('status', 'completed');
        $orderCount = (clone $orders)->count();
        $validOrderCount = (clone $validOrders)->count();

        return $this->success([
            'date_from' => $from->toDateString(),
            'date_to' => $to->toDateString(),
            'gross_revenue' => (clone $orders)->sum('grand_total'),
            'valid_revenue' => (clone $validOrders)->sum('grand_total'),
            'completed_revenue' => (clone $completedOrders)->sum('grand_total'),
            'order_count' => $orderCount,
            'completed_count' => (clone $orders)->where('status', 'completed')->count(),
            'canceled_count' => (clone $orders)->where('status', 'canceled')->count(),
            'average_order_value' => $validOrderCount > 0 ? round((float) (clone $validOrders)->avg('grand_total'), 2) : 0,
            'discount_total' => (clone $validOrders)->sum('discount_total'),
            'shipping_revenue' => (clone $validOrders)->sum('shipping_fee'),
            'new_customers' => User::query()->whereBetween('created_at', [$from->startOfDay(), $to->endOfDay()])->count(),
            'top_products' => $this->topProducts($from, $to),
            'low_stock' => ProductVariant::query()->with('product:id,name')->where('stock_quantity', '<=', 5)->orderBy('stock_quantity')->limit(10)->get(),
            'out_of_stock' => ProductVariant::query()->where('stock_quantity', 0)->count(),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        abort_unless($request->user()->hasAdminPermission('reports'), 403);

        [$from, $to] = $this->dateRange($request);
        $orders = $this->ordersInRange($from, $to)->where('status', '!=', 'canceled');

        return response()->streamDownload(function () use ($orders): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['code', 'status', 'payment_status', 'grand_total', 'discount_total', 'shipping_fee', 'created_at']);

            $orders->orderBy('created_at')->chunk(200, function ($chunk) use ($handle): void {
                foreach ($chunk as $order) {
                    fputcsv($handle, [
                        $order->code,
                        $order->status,
                        $order->payment_status,
                        $order->grand_total,
                        $order->discount_total,
                        $order->shipping_fee,
                        $order->created_at?->toDateTimeString(),
                    ]);
                }
            });

            fclose($handle);
        }, 'reports-orders.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * @return array{0:Carbon, 1:Carbon}
     */
    private function dateRange(Request $request): array
    {
        $preset = $request->string('range', 'last_30_days')->toString();

        if ($preset === 'today') {
            return [today(), today()];
        }

        if ($preset === 'last_7_days') {
            return [now()->subDays(6)->startOfDay(), now()->endOfDay()];
        }

        if ($preset === 'this_month') {
            return [now()->startOfMonth(), now()->endOfMonth()];
        }

        if ($preset === 'custom' && $request->filled(['date_from', 'date_to'])) {
            return [$request->date('date_from')->startOfDay(), $request->date('date_to')->endOfDay()];
        }

        return [now()->subDays(29)->startOfDay(), now()->endOfDay()];
    }

    private function ordersInRange($from, $to): Builder
    {
        return Order::query()->whereBetween('created_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()]);
    }

    /**
     * @return Collection<int, object>
     */
    private function topProducts($from, $to)
    {
        return OrderItem::query()
            ->selectRaw('product_id, product_name, sku, SUM(quantity) as quantity_sold, SUM(subtotal) as revenue')
            ->whereHas('order', fn ($query) => $query->where('status', '!=', 'canceled')->whereBetween('created_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()]))
            ->groupBy('product_id', 'product_name', 'sku')
            ->orderByDesc('quantity_sold')
            ->limit(10)
            ->get();
    }
}
