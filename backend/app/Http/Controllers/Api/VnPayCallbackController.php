<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Support\CommerceNotification;
use App\Support\VnPayGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VnPayCallbackController extends Controller
{
    // VNPay merchant IPN is a server-to-server GET callback; the browser return is never a payment authority.
    public function ipn(Request $request, VnPayGateway $gateway): JsonResponse
    {
        $fields = $request->query();
        if (! $gateway->configured() || ! $gateway->valid($fields)) {
            return $this->ack('97', 'Invalid Checksum');
        }
        if (($fields['vnp_TmnCode'] ?? null) !== config('commerce.vnpay.tmn_code')
            || ($fields['vnp_CurrCode'] ?? null) !== 'VND'
            || ! preg_match('/^[0-9]{1,15}$/', (string) ($fields['vnp_Amount'] ?? ''))) {
            return $this->ack('04', 'Invalid Amount');
        }

        return DB::transaction(function () use ($fields): JsonResponse {
            $attempt = PaymentAttempt::query()->where('txn_ref', $fields['vnp_TxnRef'] ?? '')->lockForUpdate()->first();
            if (! $attempt || $attempt->provider !== 'vnpay') {
                return $this->ack('01', 'Order not found');
            }
            $order = Order::query()->whereKey($attempt->order_id)->lockForUpdate()->first();
            if (! $order || $order->payment_method !== 'vnpay') {
                return $this->ack('01', 'Order not found');
            }
            if ((string) ((int) $attempt->amount_vnd * 100) !== (string) $fields['vnp_Amount']
                || (string) $order->grand_total_vnd !== (string) $attempt->amount_vnd) {
                return $this->ack('04', 'Invalid Amount');
            }
            if ($attempt->state === 'succeeded') {
                return $this->ack('02', 'Order already confirmed');
            }
            if ($order->payment_status === 'paid' || $order->status === 'cancelled') {
                return $this->ack('02', 'Order already confirmed');
            }
            if ($attempt->state !== 'pending') {
                return $this->ack('02', 'Order already confirmed');
            }

            $response = $fields['vnp_ResponseCode'] ?? null;
            $status = $fields['vnp_TransactionStatus'] ?? null;
            if (! is_string($response) || ! is_string($status) || ! preg_match('/^\d{2}$/', $response) || ! preg_match('/^\d{2}$/', $status)) {
                return $this->ack('99', 'Invalid status');
            }
            if ($response === '00' && $status === '00') {
                if (! is_string($fields['vnp_TransactionNo'] ?? null) || $fields['vnp_TransactionNo'] === '') {
                    return $this->ack('99', 'Invalid transaction');
                }
                $attempt->forceFill(['state' => 'succeeded', 'provider_transaction_id' => (string) ($fields['vnp_TransactionNo'] ?? ''),
                    'response_code' => $response, 'transaction_status' => $status, 'processed_at' => now()])->save();
                $order->forceFill(['payment_status' => 'paid', 'paid_at' => now()])->save();
                CommerceNotification::order($order, 'paid', 'Thanh toán thành công', 'Thanh toán VNPay đã được xác nhận.');

                return $this->ack('00', 'Confirm Success');
            }
            if ($status === '02' && $response !== '00') {
                $attempt->forceFill(['state' => 'failed', 'response_code' => $response,
                    'transaction_status' => $status, 'processed_at' => now()])->save();
                $order->forceFill(['payment_status' => 'failed'])->save();
                CommerceNotification::order($order, 'failed:'.$attempt->id, 'Thanh toán không thành công', 'Thanh toán VNPay không thành công. Bạn có thể thử lại.');

                return $this->ack('00', 'Confirm Success');
            }

            return $this->ack('99', 'Pending verification');
        });
    }

    public function return(Request $request, VnPayGateway $gateway): JsonResponse
    {
        $fields = $request->query();
        $attempt = $gateway->configured() && $gateway->valid($fields)
            && ($fields['vnp_TmnCode'] ?? null) === config('commerce.vnpay.tmn_code')
            && ($fields['vnp_CurrCode'] ?? null) === 'VND'
            ? PaymentAttempt::query()->where('txn_ref', $fields['vnp_TxnRef'] ?? '')->first() : null;
        if ($attempt && (string) ($attempt->amount_vnd * 100) !== (string) ($fields['vnp_Amount'] ?? '')) {
            $attempt = null;
        }

        return response()->json(['data' => [
            'verified_return' => $attempt !== null,
            'order_id' => $attempt?->order_id,
            'message' => 'Trang trả về chỉ hiển thị kết quả. Trạng thái thanh toán cần IPN hợp lệ từ VNPay.',
        ]]);
    }

    private function ack(string $code, string $message): JsonResponse
    {
        return response()->json(['RspCode' => $code, 'Message' => $message]);
    }
}
