<?php

namespace App\Support;

use App\Models\PaymentAttempt;

class VnPayReconciler
{
    public function __construct(private VnPayQueryService $query, private VnPayTransition $transition) {}

    public function reconcile(int $attemptId, ?int $actorId = null): string
    {
        // Network I/O is deliberately outside the state transition's database locks.
        $attempt = PaymentAttempt::query()->with('order')->findOrFail($attemptId);
        if ($attempt->provider !== 'vnpay' || ! in_array($attempt->state, ['pending', 'needs_review'], true)) {
            return 'duplicate';
        }
        $result = $this->query->query($attempt);
        if ($result['outcome'] === 'pending' && $attempt->pay_expires_at?->isPast()) {
            $result = ['outcome' => 'review', 'reason' => 'expired_but_query_incomplete'];
        }

        return $this->transition->apply($attemptId, $result['outcome'], 'querydr', $result['reason'],
            $result['transaction_id'] ?? null, $result['response_code'] ?? null,
            $result['transaction_status'] ?? null, $actorId, $result['verified_amount_vnd'] ?? null);
    }
}
