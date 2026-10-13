<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    use ApiResponses;

    public function __invoke(): JsonResponse
    {
        $completed = Order::query()->where('status', 'completed');

        return $this->success([
            'revenue_today' => (clone $completed)->whereDate('created_at', today())->sum('grand_total'),
            'revenue_month' => (clone $completed)->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->sum('grand_total'),
            'total_orders' => Order::query()->count(),
            'pending_orders' => Order::query()->where('status', 'pending')->count(),
            'shipping_orders' => Order::query()->where('status', 'shipping')->count(),
            'completed_orders' => Order::query()->where('status', 'completed')->count(),
            'canceled_orders' => Order::query()->where('status', 'canceled')->count(),
            'total_members' => User::query()->where('role', 'member')->count(),
            'total_products' => Product::query()->count(),
            'low_stock_products' => ProductVariant::query()->where('stock_quantity', '<=', 5)->count(),
            'top_products' => Product::query()->with(['defaultVariant', 'images'])->orderByDesc('sold_count')->limit(5)->get(),
            'recent_orders' => Order::query()->latest()->limit(8)->get(),
        ]);
    }
}
