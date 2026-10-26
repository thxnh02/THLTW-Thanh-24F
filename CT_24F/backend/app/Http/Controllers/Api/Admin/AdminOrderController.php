<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Support\OrderStatus;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminOrderController extends Controller
{
    /** Danh sách đơn hàng có phân trang; status chỉ nhận ba giá trị đã định nghĩa. */
    public function index(): AnonymousResourceCollection
    {
        $query = Order::with('user')->orderByDesc('id');
        $status = request()->query('status');
        if (in_array($status, OrderStatus::values(), true)) {
            $query->where('status', $status);
        }

        return OrderResource::collection($query->paginate(10)->withQueryString());
    }

    public function show(Order $order): OrderResource
    {
        return new OrderResource($order->load('user'));
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): OrderResource
    {
        $nextStatus = $request->validated('status');
        $updated = DB::transaction(function () use ($order, $nextStatus): Order {
            $locked = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            if (! in_array($nextStatus, $locked->allowedNextStatuses(), true)) {
                throw ValidationException::withMessages(['status' => 'Không thể chuyển đơn hàng sang trạng thái này.']);
            }
            $locked->update(['status' => $nextStatus]);

            return $locked->load('user');
        });

        return new OrderResource($updated);
    }
}
