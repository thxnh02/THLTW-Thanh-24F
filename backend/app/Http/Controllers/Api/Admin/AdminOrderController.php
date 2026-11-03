<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Support\CommerceNotification;
use App\Support\OrderStatus;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminOrderController extends Controller
{
    /** Danh sách đơn hàng có phân trang; status chỉ nhận ba giá trị đã định nghĩa. */
    public function index(): AnonymousResourceCollection
    {
        $query = Order::with(['user', 'items'])->orderByDesc('id');
        $status = request()->query('status');
        if (in_array($status, OrderStatus::values(), true)) {
            $query->where('status', $status);
        }
        $paymentStatus = request()->query('payment_status');
        if ($paymentStatus === 'needs_review') {
            $query->where(fn ($q) => $q->where('payment_status', 'needs_review')->orWhere('payment_review_required', true));
        } elseif (in_array($paymentStatus, ['pending', 'failed', 'paid', 'demo_paid'], true)) {
            $query->where('payment_status', $paymentStatus);
        }

        return OrderResource::collection($query->paginate(10)->withQueryString());
    }

    public function show(Order $order): OrderResource
    {
        return new OrderResource($order->load(['user', 'items', 'paymentAttempts', 'paymentEvents']));
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): OrderResource
    {
        $nextStatus = $request->validated('status');
        $updated = DB::transaction(function () use ($order, $nextStatus): Order {
            $locked = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            if (! in_array($nextStatus, $locked->allowedNextStatuses(), true)) {
                throw ValidationException::withMessages(['status' => 'Không thể chuyển đơn hàng sang trạng thái này.']);
            }
            if ($locked->payment_method === 'vnpay' && $locked->payment_status !== 'paid') {
                throw ValidationException::withMessages(['status' => 'Đơn VNPay chưa được xác nhận thanh toán.']);
            }
            $locked->update(['status' => $nextStatus]);
            if ($locked->payment_method !== null) {
                CommerceNotification::order($locked, 'status:'.$nextStatus,
                    'Đơn hàng đã cập nhật', $nextStatus === 'delivered' ? 'Đơn hàng đã giao.' : 'Đơn hàng đang được xử lý.');
            }

            return $locked->load('user');
        });

        return new OrderResource($updated);
    }
}
