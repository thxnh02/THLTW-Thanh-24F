<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class VnpayService
{
    public function createPaymentUrl(Order $order, string $ipAddress): string
    {
        $tmnCode = config('services.vnpay.tmn_code');
        $secret = config('services.vnpay.hash_secret');
        $paymentUrl = config('services.vnpay.url');

        if (! $tmnCode || ! $secret || ! $paymentUrl) {
            throw new HttpException(409, 'VNPay chưa được cấu hình.');
        }

        $params = [
            'vnp_Version' => '2.1.0',
            'vnp_Command' => 'pay',
            'vnp_TmnCode' => $tmnCode,
            'vnp_Amount' => (int) round((float) $order->grand_total * 100),
            'vnp_CurrCode' => 'VND',
            'vnp_TxnRef' => $order->code,
            'vnp_OrderInfo' => 'Thanh toán đơn hàng '.$order->code,
            'vnp_OrderType' => 'other',
            'vnp_Locale' => 'vn',
            'vnp_ReturnUrl' => config('services.vnpay.return_url'),
            'vnp_IpAddr' => $ipAddress,
            'vnp_CreateDate' => now()->format('YmdHis'),
            'vnp_ExpireDate' => now()->addMinutes(15)->format('YmdHis'),
        ];

        ksort($params);
        $hashData = http_build_query($params, '', '&', PHP_QUERY_RFC3986);
        $params['vnp_SecureHash'] = hash_hmac('sha512', $hashData, $secret);

        return $paymentUrl.'?'.http_build_query($params, '', '&', PHP_QUERY_RFC3986);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{order?: Order, payment?: Payment, paid?: bool, error?: string, status?: int}
     */
    public function processCallback(array $payload): array
    {
        if (! $this->isValidSignature($payload)) {
            return ['error' => 'Chữ ký VNPay không hợp lệ.', 'status' => 400];
        }

        $order = Order::query()->where('code', $payload['vnp_TxnRef'] ?? null)->first();

        if (! $order) {
            return ['error' => 'Không tìm thấy đơn hàng.', 'status' => 404];
        }

        [$order, $payment, $isPaid] = DB::transaction(function () use ($payload, $order): array {
            $lockedOrder = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
            $payment = Payment::query()->where('order_id', $lockedOrder->id)->lockForUpdate()->firstOrFail();
            $isPaid = ($payload['vnp_ResponseCode'] ?? null) === '00'
                && ($payload['vnp_TransactionStatus'] ?? null) === '00';

            if ($payment->status === 'paid') {
                return [$lockedOrder->refresh(), $payment->refresh(), true];
            }

            $payment->status = $isPaid ? 'paid' : 'failed';
            $payment->transaction_ref = $payload['vnp_TransactionNo'] ?? $payload['vnp_TxnRef'] ?? null;
            $payment->provider_payload = $payload;
            if ($isPaid) {
                $payment->paid_at ??= now();
            }
            $payment->save();

            $lockedOrder->update([
                'payment_status' => $isPaid ? 'paid' : 'failed',
            ]);

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
