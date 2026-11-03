<?php

namespace App\Support;

use App\Models\CustomerNotification;
use App\Models\Order;
use Illuminate\Support\Facades\DB;

class CommerceNotification
{
    public static function order(Order $order, string $event, string $title, string $message): void
    {
        $attributes = ['user_id' => $order->user_id, 'order_id' => $order->id, 'title' => $title,
            'message' => $message, 'link' => '/account/orders/'.$order->id];
        if (config('commerce.order_email_enabled')) {
            $attributes['email_status'] = 'pending';
            if (is_string(config('commerce.order_admin_email'))
                && filter_var(config('commerce.order_admin_email'), FILTER_VALIDATE_EMAIL)) {
                $attributes['admin_email_status'] = 'pending';
            }
        }

        $notification = CustomerNotification::query()->firstOrCreate(
            ['event_key' => 'order:'.$order->id.':'.$event],
            $attributes,
        );
        if ($notification->wasRecentlyCreated && config('commerce.order_email_enabled')) {
            DB::afterCommit(function () use ($notification): void {
                app(OrderNotificationDelivery::class)->deliverNew($notification->id);
            });
        }
    }
}
