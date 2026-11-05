<?php

namespace App\Support;

use App\Jobs\DeliverOrderNotificationEmail;
use App\Mail\AdminNewOrderMail;
use App\Mail\GenericAccountNoticeMail;
use App\Mail\OrderEventMail;
use App\Models\CustomerNotification;
use Illuminate\Contracts\Bus\Dispatcher;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Throwable;

class OrderNotificationDelivery
{
    /** Lên lịch lại các lần gửi thất bại mới, không tự gửi lại thư đã thành công. */
    public function scheduleRetryIfNeeded(int $notificationId): void
    {
        if (! config('commerce.order_email_enabled')) return;
        $notification = CustomerNotification::find($notificationId);
        if (! $notification) return;
        $delays = [];
        foreach (['email', 'admin_email'] as $prefix) {
            $attempts = (int) $notification->{$prefix.'_attempt_count'};
            if ($notification->{$prefix.'_status'} !== 'failed' || $attempts < 1
                || $attempts >= (int) config('commerce.order_email_max_attempts', 3)) continue;
            $attempted = $notification->{$prefix.'_attempted_at'};
            if ($attempted === null) continue;
            $due = $attempted->copy()->addSeconds($this->retryBackoffSeconds($attempts));
            $delays[] = max(1, (int) ceil(now()->diffInSeconds($due, false)));
        }
        if ($delays === []) return;
        try {
            $job = (new DeliverOrderNotificationEmail($notificationId, true))->onConnection('database')
                ->onQueue('order-emails')->delay(now()->addSeconds(min($delays)));
            app(Dispatcher::class)->dispatch($job);
        } catch (Throwable $exception) {
            Log::warning('Order email retry could not be queued.', ['notification_id' => $notificationId, 'error_type' => $exception::class]);
        }
    }

    public function enqueue(int $notificationId, bool $retry = false): bool
    {
        if (! config('commerce.order_email_enabled')) {
            return false;
        }

        try {
            $job = (new DeliverOrderNotificationEmail($notificationId, $retry))
                ->onConnection('database')
                ->onQueue('order-emails');
            app(Dispatcher::class)->dispatch($job);

            return true;
        } catch (Throwable $exception) {
            Log::warning('Order notification queue is unavailable; delivery remains pending.', [
                'notification_id' => $notificationId,
                'error_type' => $exception::class,
            ]);

            return false;
        }
    }

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
        if (in_array($notification->email_status, ['sent', 'skipped'], true)) return 'not_due';
        $order = $notification->order;
        $user = $order?->user;
        if (! $order || ! $user || $user->blocked_at !== null || ! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            $this->setStatus($notification->id, 'email_status', 'skipped');

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
        if (in_array($notification->admin_email_status, ['sent', 'skipped'], true)) return 'not_due';
        $address = config('commerce.order_admin_email');
        if (! $this->isNewOrderEvent($notification)) {
            $this->setStatus($notification->id, 'admin_email_status', 'skipped');

            return 'skipped';
        }
        if (! is_string($address) || ! filter_var($address, FILTER_VALIDATE_EMAIL)) {
            $this->setStatus($notification->id, 'admin_email_status', 'skipped');

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
            if ($attempts >= (int) config('commerce.order_email_max_attempts', 3) || in_array($status, ['sent', 'skipped'], true)) {
                return null;
            }

            if (! $retry && ($status !== 'pending' || $attempts !== 0)) {
                return null;
            }
            if ($retry) {
                if ($status === 'pending' && $attempts === 0) {
                    // Pending work that never reached a worker is safe to enqueue immediately.
                } else {
                    $retryAfter = $status === 'attempted'
                        ? (int) config('commerce.order_email_stale_after_seconds', 300)
                        : $this->retryBackoffSeconds($attempts);
                    if (! in_array($status, ['failed', 'attempted'], true)
                        || ! $attemptedAt?->lte(now()->subSeconds($retryAfter))) {
                        return null;
                    }
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
        return preg_match('/^order:\d+:(pending|demo_paid|cod_placed)$/', $notification->event_key) === 1;
    }

    private function retryBackoffSeconds(int $attempts): int
    {
        $schedule = config('commerce.order_email_backoff_seconds', [60, 300, 900]);
        $index = max(0, $attempts - 1);

        return (int) ($schedule[min($index, count($schedule) - 1)] ?? 900);
    }
}
