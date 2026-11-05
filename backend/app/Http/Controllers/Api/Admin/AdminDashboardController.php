<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AdminDashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $data = $request->validate(['from' => ['nullable', 'date_format:Y-m-d'], 'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from']]);
        $from = isset($data['from']) ? Carbon::parse($data['from'])->startOfDay() : now()->subDays(29)->startOfDay();
        $to = isset($data['to']) ? Carbon::parse($data['to'])->endOfDay() : now()->endOfDay();
        if ($from->gt($to)) return response()->json(['message' => 'Ngày bắt đầu phải trước ngày kết thúc.'], 422);
        $period = fn () => Order::query()->whereBetween('created_at', [$from, $to]);
        return response()->json(['data' => [
            'from' => $from->toDateString(), 'to' => $to->toDateString(),
            'orders_count' => $period()->count(),
            'delivered_count' => $period()->where('status', 'delivered')->count(),
            'delivered_total_vnd' => (int) $period()->where('status', 'delivered')->sum('grand_total_vnd'),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'new_contacts' => ContactMessage::where('status', 'new')->count(),
            'low_stock' => Product::whereNotNull('stock_quantity')->where('stock_quantity', '<=', 5)->count(),
        ]]);
    }
}
