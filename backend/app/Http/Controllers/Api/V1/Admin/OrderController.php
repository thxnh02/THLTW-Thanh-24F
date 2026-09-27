<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Concerns\RendersOrderInvoice;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Mail\OrderStatusUpdatedMail;
use App\Models\CustomerNotification;
use App\Models\Order;
use App\Services\OrderStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class OrderController extends Controller
{
    use ApiResponses;
    use RendersOrderInvoice;

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

        return $this->successPaginated($query->paginate((int) $request->integer('per_page', 15)), OrderResource::class);
    }

    public function show(Order $order): JsonResponse
    {
        return $this->success(new OrderResource($order->load(['items', 'payment', 'histories'])));
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

    public function invoicePdf(Order $order): Response
    {
        return response($this->renderInvoicePdf($order), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$order->code.'.pdf"',
        ]);
    }

    public function updateStatus(
        UpdateOrderStatusRequest $request,
        Order $order,
        OrderStatusService $orderStatusService,
    ): JsonResponse {
        $result = $orderStatusService->update($order, $request->validated(), $request->user()->id);
        $updatedOrder = $result['order'];

        if (! $result['changed']) {
            return $this->success(new OrderResource($updatedOrder), 'Trạng thái không thay đổi.');
        }

        $this->notifyOrderStatus($updatedOrder);

        return $this->success(new OrderResource($updatedOrder), 'Đã cập nhật trạng thái đơn hàng.');
    }

    private function notifyOrderStatus(Order $order): void
    {
        $labels = [
            'confirmed' => 'Đã xác nhận',
            'shipping' => 'Đang giao',
            'completed' => 'Hoàn thành',
            'canceled' => 'Đã hủy',
        ];

        if (! isset($labels[$order->status])) {
            return;
        }

        if ($order->user_id) {
            CustomerNotification::create([
                'user_id' => $order->user_id,
                'type' => 'order_status',
                'title' => 'Đơn hàng '.$order->code,
                'message' => 'Trạng thái mới: '.$labels[$order->status],
                'action_url' => '/account/orders/'.$order->code,
            ]);
        }

        try {
            Mail::to($order->customer_email)->send(new OrderStatusUpdatedMail($order, $labels[$order->status]));
        } catch (Throwable $exception) {
            Log::warning('Order status email failed.', [
                'order_id' => $order->id,
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
