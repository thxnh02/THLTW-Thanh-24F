<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CustomerNotification;
use App\Models\Order;
use App\Support\OrderNotificationDelivery;
use Illuminate\Validation\ValidationException;

class AdminOrderEmailController extends Controller
{
    public function retry(Order $order, CustomerNotification $notification, OrderNotificationDelivery $delivery)
    {
        abort_unless((int) $notification->order_id === (int) $order->id, 404);
        if (! config('commerce.order_email_enabled')) {
            throw ValidationException::withMessages(['email' => 'Email đơn hàng đang tắt.']);
        }
        $eligible = false;
        $max = (int) config('commerce.order_email_max_attempts', 3);
        $backoff = config('commerce.order_email_backoff_seconds', [60, 300, 900]);
        foreach (['email', 'admin_email'] as $prefix) {
            $status = $notification->{$prefix.'_status'};
            $attempts = (int) $notification->{$prefix.'_attempt_count'};
            $at = $notification->{$prefix.'_attempted_at'};
            if ($status === 'pending' && $attempts === 0) $eligible = true;
            if ($attempts < 1 || $attempts >= $max || ! $at) continue;
            $delay = $status === 'attempted' ? (int) config('commerce.order_email_stale_after_seconds', 300)
                : (int) ($backoff[min($attempts - 1, count($backoff) - 1)] ?? 900);
            if (in_array($status, ['failed', 'attempted'], true) && $at->copy()->addSeconds($delay)->isPast()) $eligible = true;
        }
        if (! $eligible) throw ValidationException::withMessages(['email' => 'Chưa đến thời gian thử lại, đã gửi hoặc đã hết số lần gửi.']);
        if (! $delivery->enqueue($notification->id, retry: true)) {
            throw ValidationException::withMessages(['email' => 'Không thể đưa email vào hàng đợi.']);
        }
        return response()->json(['message' => 'Đã đưa email đủ điều kiện vào hàng đợi.']);
    }
}
