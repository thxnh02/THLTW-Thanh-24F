<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VnpayController extends Controller
{
    use ApiResponses;

    public function return(Request $request): JsonResponse
    {
        return $this->handleCallback($request);
    }

    public function ipn(Request $request): JsonResponse
    {
        return $this->handleCallback($request);
    }

    private function handleCallback(Request $request): JsonResponse
    {
        $payload = $request->query();

        if (! $this->isValidSignature($payload)) {
            return $this->error('Chữ ký VNPay không hợp lệ.', 400);
        }

        $order = Order::query()->where('code', $payload['vnp_TxnRef'] ?? null)->first();

        if (! $order) {
            return $this->error('Không tìm thấy đơn hàng.', 404);
        }

        $payment = Payment::query()->where('order_id', $order->id)->firstOrFail();
        $isPaid = ($payload['vnp_ResponseCode'] ?? null) === '00'
            && ($payload['vnp_TransactionStatus'] ?? null) === '00';

        $payment->update([
            'status' => $isPaid ? 'paid' : 'failed',
            'transaction_ref' => $payload['vnp_TransactionNo'] ?? $payload['vnp_TxnRef'] ?? null,
            'provider_payload' => $payload,
        ]);

        $order->update([
            'payment_status' => $isPaid ? 'paid' : 'failed',
        ]);

        return $this->success([
            'order' => $order->refresh(),
            'payment' => $payment->refresh(),
        ], $isPaid ? 'Thanh toán VNPay thành công.' : 'Thanh toán VNPay không thành công.');
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
