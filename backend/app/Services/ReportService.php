<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class ReportService
{
    /**
     * @return array<string, mixed>
     */
    public function overview(Carbon $from, Carbon $to): array
    {
        $orders = $this->ordersInRange($from, $to);
        $validOrders = (clone $orders)->where('status', '!=', 'canceled');
        $completedOrders = (clone $orders)->where('status', 'completed');
        $validOrderCount = (clone $validOrders)->count();

        return [
            'date_from' => $from->toDateString(),
            'date_to' => $to->toDateString(),
            'gross_revenue' => (clone $orders)->sum('grand_total'),
            'valid_revenue' => (clone $validOrders)->sum('grand_total'),
            'completed_revenue' => (clone $completedOrders)->sum('grand_total'),
            'order_count' => (clone $orders)->count(),
            'completed_count' => (clone $completedOrders)->count(),
            'canceled_count' => (clone $orders)->where('status', 'canceled')->count(),
            'average_order_value' => $validOrderCount > 0 ? round((float) (clone $validOrders)->avg('grand_total'), 2) : 0,
            'discount_total' => (clone $validOrders)->sum('discount_total'),
            'shipping_revenue' => (clone $validOrders)->sum('shipping_fee'),
            'new_customers' => User::query()->whereBetween('created_at', [$from->startOfDay(), $to->endOfDay()])->count(),
            'top_products' => $this->topProducts($from, $to),
            'low_stock' => ProductVariant::query()->with('product:id,name')->where('stock_quantity', '<=', 5)->orderBy('stock_quantity')->limit(10)->get(),
            'out_of_stock' => ProductVariant::query()->where('stock_quantity', 0)->count(),
        ];
    }

    private function ordersInRange(Carbon $from, Carbon $to)
    {
        return Order::query()->whereBetween('created_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()]);
    }

    /**
     * @return Collection<int, object>
     */
    private function topProducts(Carbon $from, Carbon $to): Collection
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
