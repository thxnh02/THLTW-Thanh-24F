<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Concerns\RendersOrderInvoice;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

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

        return $this->successPaginated($orders, OrderResource::class);
    }

    public function show(Request $request, string $code): JsonResponse
    {
        $order = $this->orderForUser($request, $code)->load([
            'items',
            'payment',
            'histories' => fn ($query) => $query->oldest(),
        ]);

        return $this->success(new OrderResource($order));
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

    public function cancel(Request $request, string $code, OrderStatusService $orderStatusService): JsonResponse
    {
        $order = $orderStatusService->cancelForMember(
            $this->orderForUser($request, $code),
            $request->user()->id,
        );

        return $this->success(new OrderResource($order), 'Đã hủy đơn hàng.');
    }

    private function orderForUser(Request $request, string $code): Order
    {
        return Order::query()
            ->where('user_id', $request->user()->id)
            ->where('code', $code)
            ->firstOrFail();
    }
}
