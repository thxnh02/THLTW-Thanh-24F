<?php

namespace App\Support;

use App\Models\Order;
use App\Models\PaymentAttempt;
use Illuminate\Support\Facades\DB;

class VnPayTransition
{
    // Call only after the source-specific checksum and merchant/amount checks pass.
    public function apply(int $attemptId, string $outcome, string $source, string $reason,
        ?string $transactionId = null, ?string $responseCode = null, ?string $transactionStatus = null,
        ?int $actorId = null, ?int $verifiedAmountVnd = null): string
    {
        return DB::transaction(function () use ($attemptId, $outcome, $source, $reason, $transactionId, $responseCode, $transactionStatus, $actorId, $verifiedAmountVnd): string {
            $orderId = PaymentAttempt::query()->whereKey($attemptId)->value('order_id');
            $order = Order::query()->whereKey($orderId)->lockForUpdate()->firstOrFail();
            $attempt = PaymentAttempt::query()->whereKey($attemptId)->lockForUpdate()->firstOrFail();
            if ($attempt->order_id !== $order->id || $attempt->provider !== 'vnpay' || $order->payment_method !== 'vnpay'
                || (int) $order->grand_total_vnd !== (int) $attempt->amount_vnd
                || ($verifiedAmountVnd !== null && $verifiedAmountVnd !== (int) $attempt->amount_vnd)) {
                return 'invalid';
            }
            $latestId = $order->paymentAttempts()->max('id');
            $now = now();
            $attempt->last_checked_at = $now;
            $attempt->response_code = $responseCode ?? $attempt->response_code;
            $attempt->transaction_status = $transactionStatus ?? $attempt->transaction_status;
            $result = $outcome;
            if ($attempt->state === 'succeeded') {
                if ($outcome === 'success' && $transactionId && $attempt->provider_transaction_id !== $transactionId) {
                    $order->payment_review_required = true;
                    $order->save();
                    $attempt->review_reason = 'conflicting_transaction_id';
                    $result = 'review';
                } elseif ($outcome === 'review' && in_array($transactionStatus, ['04', '07'], true)) {
                    $order->payment_review_required = true;
                    $order->save();
                    $attempt->review_reason = $reason;
                    $result = 'review';
                } else {
                    $result = 'duplicate';
                }
            } elseif ($outcome === 'success') {
                if ($order->payment_status === 'paid' || $order->status === 'cancelled' || $order->stock_restored_at || $latestId !== $attempt->id) {
                    $attempt->state = 'needs_review';
                    $attempt->review_reason = 'late_or_conflicting_success';
                    $attempt->provider_transaction_id = $transactionId;
                    $order->payment_review_required = true;
                    if ($order->payment_status !== 'paid') {
                        $order->payment_status = 'needs_review';
                    }
                    $order->save();
                    $result = 'review';
                } else {
                    $attempt->state = 'succeeded';
                    $attempt->provider_transaction_id = $transactionId;
                    $attempt->processed_at = $now;
                    $order->forceFill(['payment_status' => 'paid', 'paid_at' => $now])->save();
                    CommerceNotification::order($order, 'paid', 'Thanh toán thành công', 'Thanh toán VNPay đã được xác nhận.');
                }
            } elseif ($outcome === 'failed') {
                if ($order->payment_status === 'paid' || $order->status === 'cancelled' || $latestId !== $attempt->id) {
                    $result = 'duplicate';
                } else {
                    $attempt->state = 'failed';
                    $attempt->processed_at = $now;
                    $attempt->review_reason = null;
                    $order->payment_status = 'failed';
                    $order->save();
                    CommerceNotification::order($order, 'failed:'.$attempt->id, 'Thanh toán không thành công', 'VNPay xác nhận giao dịch không thành công. Bạn có thể thử lại.');
                }
            } elseif ($outcome === 'review' && ($latestId === $attempt->id || $order->status === 'cancelled')) {
                $attempt->state = 'needs_review';
                $attempt->review_reason = $reason;
                if ($order->status === 'cancelled' || $order->payment_status === 'paid') {
                    $order->payment_review_required = true;
                }
                if ($order->payment_status !== 'paid') {
                    $order->payment_status = 'needs_review';
                }
                $order->save();
            } elseif ($outcome !== 'pending') {
                $result = 'duplicate';
            }
            $attempt->save();
            DB::table('payment_reconciliation_events')->insert([
                'order_id' => $order->id, 'payment_attempt_id' => $attempt->id, 'actor_user_id' => $actorId,
                'source' => $source, 'outcome' => $result, 'reason' => $reason, 'created_at' => $now,
            ]);

            return $result;
        });
    }
}
