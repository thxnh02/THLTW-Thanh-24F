<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Support\CommerceNotification;
use App\Support\OrderStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminOrderController extends Controller
{
    /** Danh sách đơn hàng có phân trang; status chỉ nhận ba giá trị đã định nghĩa. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $this->validatedFilters($request);

        return OrderResource::collection($this->filteredOrders($filters)->with(['user', 'items'])->orderByDesc('id')->paginate(10)->withQueryString());
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $filters = $this->validatedFilters($request);
        $query = $this->filteredOrders($filters)->with('user')->orderBy('orders.id');

        return response()->streamDownload(function () use ($query): void {
            $stream = fopen('php://output', 'wb');
            fwrite($stream, "\xEF\xBB\xBF");
            fputcsv($stream, ['Mã đơn', 'Ngày tạo', 'Khách hàng', 'Phương thức thanh toán', 'Trạng thái thanh toán', 'Trạng thái đơn', 'Tổng tiền (VND)']);
            foreach ($query->lazyById(200, 'orders.id', 'id') as $order) {
                $paymentMethod = match ($order->payment_method) {
                    'vnpay' => 'VNPay',
                    'cod' => 'Thanh toán khi nhận hàng (COD)',
                    default => '',
                };
                $paymentStatus = match ($order->payment_status) {
                    'demo_paid' => 'COD · chờ thu khi giao hàng',
                    'pending' => 'Chờ xác nhận VNPay',
                    'paid' => 'VNPay đã xác nhận',
                    'failed' => 'Thanh toán không thành công',
                    'needs_review' => 'Cần đối soát',
                    default => $order->payment_status ?? '',
                };
                $values = [
                    $order->order_code ?? 'Đơn cũ #'.$order->id,
                    $order->created_at?->format('Y-m-d H:i:s') ?? '',
                    $order->user?->name ?? '',
                    $paymentMethod, $paymentStatus, $order->status ?? '', $order->grand_total_vnd ?? '',
                ];
                fputcsv($stream, array_map(fn ($value) => $this->safeCsvCell($value), $values), ',', '"', '');
            }
            fclose($stream);
        }, 'ct24f-danh-sach-don-'.now()->format('Ymd-His').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function show(Order $order): OrderResource
    {
        return new OrderResource($order->load(['user', 'items', 'paymentAttempts', 'paymentEvents', 'notifications']));
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

    private function validatedFilters(Request $request): array
    {
        $paymentStatuses = ['pending', 'failed', 'paid', 'demo_paid', 'needs_review'];

        return Validator::make($request->query(), [
            'status' => ['nullable', 'string', 'in:'.implode(',', OrderStatus::values())],
            'payment_status' => ['nullable', 'string', 'in:'.implode(',', $paymentStatuses)],
            'created_from' => ['nullable', 'date_format:Y-m-d'],
            'created_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:created_from'],
        ])->validate();
    }

    private function filteredOrders(array $filters): Builder
    {
        $query = Order::query();
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (($filters['payment_status'] ?? null) === 'needs_review') {
            $query->where(fn ($builder) => $builder->where('payment_status', 'needs_review')->orWhere('payment_review_required', true));
        } elseif (! empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }
        if (! empty($filters['created_from'])) {
            $query->whereDate('created_at', '>=', $filters['created_from']);
        }
        if (! empty($filters['created_to'])) {
            $query->whereDate('created_at', '<=', $filters['created_to']);
        }

        return $query;
    }

    private function safeCsvCell(mixed $value): string
    {
        $cell = (string) $value;
        if (preg_match('/^[\x00-\x20]*[=+\-@]/u', $cell) === 1) {
            return "'".$cell;
        }

        return $cell;
    }
}
