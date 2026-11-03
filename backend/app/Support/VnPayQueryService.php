<?php

namespace App\Support;

use App\Models\PaymentAttempt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class VnPayQueryService
{
    private const URL = 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';

    private const REQUEST_FIELDS = ['vnp_RequestId', 'vnp_Version', 'vnp_Command', 'vnp_TmnCode', 'vnp_TxnRef',
        'vnp_TransactionDate', 'vnp_CreateDate', 'vnp_IpAddr', 'vnp_OrderInfo'];

    private const RESPONSE_FIELDS = ['vnp_ResponseId', 'vnp_Command', 'vnp_ResponseCode', 'vnp_Message', 'vnp_TmnCode',
        'vnp_TxnRef', 'vnp_Amount', 'vnp_BankCode', 'vnp_PayDate', 'vnp_TransactionNo', 'vnp_TransactionType',
        'vnp_TransactionStatus', 'vnp_OrderInfo', 'vnp_PromotionCode', 'vnp_PromotionAmount'];

    public function configured(): bool
    {
        return app(VnPayGateway::class)->configured() && config('commerce.vnpay.query_enabled')
            && config('commerce.vnpay.query_url') === self::URL
            && filter_var(config('commerce.vnpay.query_ip'), FILTER_VALIDATE_IP);
    }

    public function requestHash(array $fields): string
    {
        return $this->hash(self::REQUEST_FIELDS, $fields);
    }

    public function responseHash(array $fields): string
    {
        return $this->hash(self::RESPONSE_FIELDS, $fields);
    }

    private function hash(array $orderedFields, array $fields): string
    {
        return hash_hmac('sha512', implode('|', array_map(fn (string $key) => (string) ($fields[$key] ?? ''), $orderedFields)),
            (string) config('commerce.vnpay.hash_secret'));
    }

    public function query(PaymentAttempt $attempt): array
    {
        if (! $this->configured()) {
            return ['outcome' => 'review', 'reason' => 'query_not_configured'];
        }
        if (! $attempt->pay_created_at || ! $attempt->pay_expires_at) {
            return ['outcome' => 'review', 'reason' => 'legacy_missing_pay_timestamp'];
        }
        $order = $attempt->order;
        if (! $order || $order->payment_method !== 'vnpay' || (int) $order->grand_total_vnd !== (int) $attempt->amount_vnd) {
            return ['outcome' => 'review', 'reason' => 'local_order_mismatch'];
        }
        $request = [
            'vnp_RequestId' => Str::upper(Str::random(32)), 'vnp_Version' => '2.1.0', 'vnp_Command' => 'querydr',
            'vnp_TmnCode' => (string) config('commerce.vnpay.tmn_code'), 'vnp_TxnRef' => $attempt->txn_ref,
            'vnp_OrderInfo' => 'Thanh toan don hang '.$order->id,
            'vnp_TransactionDate' => $attempt->pay_created_at->copy()->setTimezone('Asia/Ho_Chi_Minh')->format('YmdHis'),
            'vnp_CreateDate' => now('Asia/Ho_Chi_Minh')->format('YmdHis'),
            'vnp_IpAddr' => (string) config('commerce.vnpay.query_ip'),
        ];
        $request['vnp_SecureHash'] = $this->requestHash($request);
        try {
            $response = Http::asJson()->acceptJson()->connectTimeout(3)->timeout(8)->withoutRedirecting()->post(self::URL, $request);
            if (! $response->successful()) {
                return ['outcome' => 'review', 'reason' => 'query_http_error'];
            }
            $fields = $response->json();
        } catch (\Throwable) {
            return ['outcome' => 'review', 'reason' => 'query_network_error'];
        }
        if (! is_array($fields) || ! $this->validResponse($fields)) {
            return ['outcome' => 'review', 'reason' => 'query_invalid_signature'];
        }
        if (($fields['vnp_ResponseCode'] ?? null) !== '00') {
            return ['outcome' => 'review', 'reason' => 'query_api_error'];
        }
        if (! is_string($fields['vnp_Message'] ?? null) || $fields['vnp_Message'] === ''
            || ! is_string($fields['vnp_OrderInfo'] ?? null) || $fields['vnp_OrderInfo'] === ''
            || ! is_string($fields['vnp_BankCode'] ?? null) || $fields['vnp_BankCode'] === '') {
            return ['outcome' => 'review', 'reason' => 'query_malformed'];
        }
        if (($fields['vnp_TmnCode'] ?? null) !== $request['vnp_TmnCode'] || ($fields['vnp_TxnRef'] ?? null) !== $attempt->txn_ref
            || ($fields['vnp_Amount'] ?? null) !== (string) ((int) $attempt->amount_vnd * 100)
            || ($fields['vnp_TransactionType'] ?? null) !== '01') {
            return ['outcome' => 'review', 'reason' => 'query_transaction_mismatch'];
        }
        $status = $fields['vnp_TransactionStatus'] ?? null;
        if (in_array($status, ['00', '02'], true)
            && ! preg_match('/^[0-9]{1,15}$/', (string) ($fields['vnp_TransactionNo'] ?? ''))) {
            return ['outcome' => 'review', 'reason' => 'query_transaction_mismatch'];
        }
        if ($status === '00' && preg_match('/^[0-9]{1,15}$/', (string) ($fields['vnp_TransactionNo'] ?? ''))) {
            return ['outcome' => 'success', 'reason' => 'query_paid', 'transaction_id' => $fields['vnp_TransactionNo'],
                'response_code' => '00', 'transaction_status' => '00', 'verified_amount_vnd' => intdiv((int) $fields['vnp_Amount'], 100)];
        }
        if ($status === '02') {
            return ['outcome' => 'failed', 'reason' => 'query_terminal_failure', 'response_code' => '00', 'transaction_status' => '02',
                'verified_amount_vnd' => intdiv((int) $fields['vnp_Amount'], 100)];
        }
        if ($status === '01') {
            return ['outcome' => 'pending', 'reason' => 'query_incomplete', 'response_code' => '00', 'transaction_status' => '01'];
        }

        return ['outcome' => 'review', 'reason' => 'query_suspicious_status', 'response_code' => '00', 'transaction_status' => is_string($status) ? $status : null];
    }

    private function validResponse(array $fields): bool
    {
        foreach ($fields as $key => $value) {
            if (str_starts_with((string) $key, 'vnp_') && ! is_string($value) && ! is_int($value)) {
                return false;
            }
        }
        foreach (['vnp_ResponseId', 'vnp_ResponseCode', 'vnp_TmnCode', 'vnp_TxnRef', 'vnp_Amount', 'vnp_TransactionStatus'] as $key) {
            if (! isset($fields[$key]) || ! is_string($fields[$key])) {
                return false;
            }
        }
        if (! preg_match('/^[A-Za-z0-9]{1,32}$/', $fields['vnp_ResponseId'])
            || ! preg_match('/^[0-9]{2}$/', $fields['vnp_ResponseCode'])
            || ! preg_match('/^[0-9]{2}$/', $fields['vnp_TransactionStatus'])
            || ! preg_match('/^[0-9]{1,12}$/', $fields['vnp_Amount'])) {
            return false;
        }
        if (isset($fields['vnp_Command']) && $fields['vnp_Command'] !== 'querydr') {
            return false;
        }
        $hash = $fields['vnp_SecureHash'] ?? null;

        return is_string($hash) && preg_match('/^[a-fA-F0-9]{128}$/', $hash) === 1
            && hash_equals($this->responseHash($fields), strtolower($hash));
    }
}
