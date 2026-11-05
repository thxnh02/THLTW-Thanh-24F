<?php

namespace App\Jobs;

use App\Support\OrderNotificationDelivery;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DeliverOrderNotificationEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 30;

    public function __construct(public int $notificationId, public bool $retryDelivery = false) {}

    public function handle(OrderNotificationDelivery $delivery): void
    {
        if ($this->retryDelivery) {
            $delivery->retry($this->notificationId);
        } else {
            $delivery->deliverNew($this->notificationId);
        }
        $delivery->scheduleRetryIfNeeded($this->notificationId);
    }
}
