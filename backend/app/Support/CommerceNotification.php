<?php

namespace App\Support;

use App\Mail\OrderEventMail;
use App\Models\CustomerNotification;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class CommerceNotification
{
    public static function order(Order $order, string $event, string $title, string $message): void
    {
        $notification = CustomerNotification::query()->firstOrCreate(
            ['event_key' => 'order:'.$order->id.':'.$event],
            ['user_id' => $order->user_id, 'order_id' => $order->id, 'title' => $title,
                'message' => $message, 'link' => '/account/orders/'.$order->id]
        );
        if ($notification->wasRecentlyCreated && config('commerce.order_email_enabled')) {
            DB::afterCommit(function () use ($notification): void {
                $customer = $notification->order?->user;
                if (! $customer || ! $customer->email_verified_at || $customer->blocked_at) {
                    return;
                }
                $notification->forceFill(['email_status' => 'attempted', 'email_attempted_at' => now()])->save();
                try {
                    Mail::to($customer->email)->send(new OrderEventMail($notification->order_id, $notification->title, $notification->message));
                    $notification->forceFill(['email_status' => 'sent', 'email_sent_at' => now()])->save();
                } catch (\Throwable) {
                    $notification->forceFill(['email_status' => 'failed'])->save();
                }
            });
        }
    }
}
