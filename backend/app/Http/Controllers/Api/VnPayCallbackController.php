<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentAttempt;
use App\Support\VnPayGateway;
use App\Support\VnPayTransition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VnPayCallbackController extends Controller
{
    // Browser Return is display-only. Only a verified server-to-server IPN or QueryDr changes payment state.
    public function ipn(Request $request, VnPayGateway $gateway, VnPayTransition $transition): JsonResponse
    {
        $fields = $request->query();
        if (! $gateway->configured() || ! $gateway->valid($fields)) {
            return $this->ack('97', 'Invalid Checksum');
        }
        if (($fields['vnp_TmnCode'] ?? null) !== config('commerce.vnpay.tmn_code')
            || ($fields['vnp_CurrCode'] ?? null) !== 'VND'
            || ! preg_match('/^[0-9]{1,12}$/', (string) ($fields['vnp_Amount'] ?? ''))) {
            return $this->ack('04', 'Invalid Amount');
        }
        $attempt = PaymentAttempt::query()->where('txn_ref', $fields['vnp_TxnRef'] ?? '')->first();
        if (! $attempt || $attempt->provider !== 'vnpay') {
            return $this->ack('01', 'Order not found');
        }
        if ((string) ((int) $attempt->amount_vnd * 100) !== $fields['vnp_Amount']
            || (int) $attempt->order?->grand_total_vnd !== (int) $attempt->amount_vnd) {
            return $this->ack('04', 'Invalid Amount');
        }
        $response = $fields['vnp_ResponseCode'] ?? null;
        $status = $fields['vnp_TransactionStatus'] ?? null;
        if (! is_string($response) || ! is_string($status) || ! preg_match('/^\d{2}$/', $response) || ! preg_match('/^\d{2}$/', $status)) {
            return $this->ack('99', 'Invalid status');
        }
        $transactionId = $fields['vnp_TransactionNo'] ?? null;
        if ($response === '00' && $status === '00') {
            if (! is_string($transactionId) || ! preg_match('/^[0-9A-Za-z]{1,100}$/', $transactionId)) {
                return $this->ack('99', 'Invalid transaction');
            }
            $outcome = 'success';
        } elseif ($status === '02' && $response !== '00') {
            $outcome = 'failed';
        } elseif ($status === '01') {
            $outcome = 'pending';
        } else {
            $outcome = 'review';
        }
        $result = $transition->apply($attempt->id, $outcome, 'ipn', 'ipn_'.$status,
            is_string($transactionId) ? $transactionId : null, $response, $status, null, intdiv((int) $fields['vnp_Amount'], 100));

        return match ($result) {
            'success', 'failed' => $this->ack('00', 'Confirm Success'),
            'review' => $this->ack('00', 'Recorded for review'),
            'duplicate' => $this->ack('02', 'Order already confirmed'),
            'invalid' => $this->ack('04', 'Invalid Amount'),
            default => $this->ack('99', 'Pending review'),
        };
    }

    public function return(Request $request, VnPayGateway $gateway): JsonResponse
    {
        $fields = $request->query();
        $attempt = $gateway->configured() && $gateway->valid($fields)
            && ($fields['vnp_TmnCode'] ?? null) === config('commerce.vnpay.tmn_code')
            && ($fields['vnp_CurrCode'] ?? null) === 'VND'
            ? PaymentAttempt::query()->where('txn_ref', $fields['vnp_TxnRef'] ?? '')->first() : null;
        if ($attempt && ((string) ($attempt->amount_vnd * 100) !== (string) ($fields['vnp_Amount'] ?? '')
            || $attempt->order?->user_id !== $request->user()?->id)) {
            $attempt = null;
        }

        return response()->json(['data' => [
            'verified_return' => $attempt !== null,
            'order_id' => $attempt?->order_id,
            'message' => 'Trang trả về chỉ hiển thị kết quả. Trạng thái thanh toán cần IPN hoặc QueryDr hợp lệ từ VNPay.',
        ]]);
    }

    private function ack(string $code, string $message): JsonResponse
    {
        return response()->json(['RspCode' => $code, 'Message' => $message]);
    }
}
