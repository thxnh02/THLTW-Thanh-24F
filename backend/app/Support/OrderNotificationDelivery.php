<?php

namespace App\Support;

use App\Mail\AdminNewOrderMail;
use App\Mail\GenericAccountNoticeMail;
use App\Mail\OrderEventMail;
use App\Models\CustomerNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Throwable;

class OrderNotificationDelivery
{
    public function deliverNew(int $notificationId): void
    {
        if (! config('commerce.order_email_enabled')) {
            return;
        }

        $notification = CustomerNotification::query()->with(['order.user', 'order.items'])->find($notificationId);
        if (! $notification?->order) {
            return;
        }

        $this->deliverCustomer($notification, retry: false);
        $this->deliverAdmin($notification, retry: false);
    }

    public function retry(int $notificationId): array
    {
        if (! config('commerce.order_email_enabled')) {
            return ['customer' => 'disabled', 'admin' => 'disabled'];
        }

        $notification = CustomerNotification::query()->with(['order.user', 'order.items'])->find($notificationId);
        if (! $notification?->order) {
            return ['customer' => 'missing', 'admin' => 'missing'];
        }

        return [
            'customer' => $this->deliverCustomer($notification, retry: true),
            'admin' => $this->deliverAdmin($notification, retry: true),
        ];
    }

    private function deliverCustomer(CustomerNotification $notification, bool $retry): string
    {
        $order = $notification->order;
        $user = $order?->user;
        if (! $order || ! $user || $user->blocked_at !== null || ! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return 'skipped';
        }

        $verified = $user->email_verified_at !== null;
        if (! $verified) {
            if (! $this->isNewOrderEvent($notification) || ! RateLimiter::attempt(
                'unverified-order-email:'.hash('sha256', $user->email), 3, fn (): bool => true, 3600,
            )) {
                $this->setStatus($notification->id, 'email_status', 'skipped');

                return 'skipped';
            }
        }

        $attempt = $this->claim($notification->id, admin: false, retry: $retry);
        if ($attempt === null) {
            return 'not_due';
        }

        try {
            if ($verified) {
                Mail::to($user->email)->send(new OrderEventMail($order, $notification->title, $notification->message));
            } else {
                Mail::to($user->email)->send(new GenericAccountNoticeMail);
            }
            $this->markSent($notification->id, admin: false);

            return 'accepted';
        } catch (Throwable $exception) {
            $this->markFailed($notification->id, admin: false);
            Log::warning('Order notification email delivery failed.', [
                'notification_id' => $notification->id,
                'attempt' => $attempt,
                'error_type' => $exception::class,
            ]);

            return 'failed';
        }
    }

    private function deliverAdmin(CustomerNotification $notification, bool $retry): string
    {
        $address = config('commerce.order_admin_email');
        if (! $this->isNewOrderEvent($notification) || ! is_string($address) || ! filter_var($address, FILTER_VALIDATE_EMAIL)) {
            return 'skipped';
        }

        $attempt = $this->claim($notification->id, admin: true, retry: $retry);
        if ($attempt === null) {
            return 'not_due';
        }

        try {
            Mail::to($address)->send(new AdminNewOrderMail($notification->order));
            $this->markSent($notification->id, admin: true);

            return 'accepted';
        } catch (Throwable $exception) {
            $this->markFailed($notification->id, admin: true);
            Log::warning('Admin new-order email delivery failed.', [
                'notification_id' => $notification->id,
                'attempt' => $attempt,
                'error_type' => $exception::class,
            ]);

            return 'failed';
        }
    }

    private function claim(int $id, bool $admin, bool $retry): ?int
    {
        return DB::transaction(function () use ($id, $admin, $retry): ?int {
            $notification = CustomerNotification::query()->whereKey($id)->lockForUpdate()->first();
            if (! $notification) {
                return null;
            }

            $statusColumn = $admin ? 'admin_email_status' : 'email_status';
            $attemptedColumn = $admin ? 'admin_email_attempted_at' : 'email_attempted_at';
            $countColumn = $admin ? 'admin_email_attempt_count' : 'email_attempt_count';
            $status = $notification->{$statusColumn};
            $attempts = (int) $notification->{$countColumn};
            $attemptedAt = $notification->{$attemptedColumn};
            if ($attempts >= 3 || $status === 'sent') {
                return null;
            }

            if (! $retry && ($status !== 'pending' || $attempts !== 0)) {
                return null;
            }
            if ($retry) {
                $retryAfter = $status === 'attempted' ? 300 : 60 * (2 ** max(0, $attempts - 1));
                if (! in_array($status, ['failed', 'attempted'], true)
                    || ! $attemptedAt?->lte(now()->subSeconds($retryAfter))) {
                    return null;
                }
            }

            $notification->forceFill([
                $statusColumn => 'attempted',
                $attemptedColumn => now(),
                $countColumn => $attempts + 1,
            ])->save();

            return $attempts + 1;
        });
    }

    private function markSent(int $id, bool $admin): void
    {
        $columns = $admin
            ? ['admin_email_status' => 'sent']
            : ['email_status' => 'sent', 'email_sent_at' => now()];
        CustomerNotification::query()->whereKey($id)->update($columns);
    }

    private function markFailed(int $id, bool $admin): void
    {
        $statusColumn = $admin ? 'admin_email_status' : 'email_status';
        CustomerNotification::query()->whereKey($id)->update([$statusColumn => 'failed']);
    }

    private function setStatus(int $id, string $column, string $status): void
    {
        CustomerNotification::query()->whereKey($id)->update([$column => $status]);
    }

    private function isNewOrderEvent(CustomerNotification $notification): bool
    {
        return preg_match('/^order:\d+:(pending|demo_paid)$/', $notification->event_key) === 1;
    }
}
