<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\ReportService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    use ApiResponses;

    public function overview(Request $request, ReportService $reportService): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('reports'), 403);

        [$from, $to] = $this->dateRange($request);

        return $this->success($reportService->overview($from, $to));
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
}
