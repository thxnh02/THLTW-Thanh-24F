<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

class VnpayService
{
    /**
     * @param  array<string, mixed>  $payload
     * @return array{order?: Order, payment?: Payment, paid?: bool, error?: string, status?: int}
     */
    public function processCallback(array $payload): array
    {
        if (! $this->isValidSignature($payload)) {
            return ['error' => 'Chu ky VNPay khong hop le.', 'status' => 400];
        }

        $order = Order::query()->where('code', $payload['vnp_TxnRef'] ?? null)->first();

        if (! $order) {
            return ['error' => 'Khong tim thay don hang.', 'status' => 404];
        }

        [$order, $payment, $isPaid] = DB::transaction(function () use ($payload, $order): array {
            $lockedOrder = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
            $payment = Payment::query()->where('order_id', $lockedOrder->id)->lockForUpdate()->firstOrFail();
            $isPaid = ($payload['vnp_ResponseCode'] ?? null) === '00'
                && ($payload['vnp_TransactionStatus'] ?? null) === '00';

            if ($payment->status !== 'paid') {
                $payment->update([
                    'status' => $isPaid ? 'paid' : 'failed',
                    'transaction_ref' => $payload['vnp_TransactionNo'] ?? $payload['vnp_TxnRef'] ?? null,
                    'provider_payload' => $payload,
                ]);

                $lockedOrder->update([
                    'payment_status' => $isPaid ? 'paid' : 'failed',
                ]);
            }

            return [$lockedOrder->refresh(), $payment->refresh(), $isPaid];
        });

        return ['order' => $order, 'payment' => $payment, 'paid' => $isPaid];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function isValidSignature(array $payload): bool
    {
        $secureHash = (string) ($payload['vnp_SecureHash'] ?? '');
        $secret = config('services.vnpay.hash_secret');

        if (! $secureHash || ! $secret) {
            return false;
        }

        unset($payload['vnp_SecureHash'], $payload['vnp_SecureHashType']);
        ksort($payload);

        $hashData = http_build_query($payload, '', '&', PHP_QUERY_RFC3986);
        $calculated = hash_hmac('sha512', $hashData, $secret);

        return hash_equals($calculated, $secureHash);
    }
}
