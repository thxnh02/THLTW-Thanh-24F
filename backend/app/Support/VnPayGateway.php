<?php

namespace App\Support;

use App\Models\PaymentAttempt;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class VnPayGateway
{
    public const MIN_VND = 5000;

    // vnp_Amount is an at-most 12-digit integer in units of 1/100 VND.
    public const MAX_VND = 9999999999;

    public function assertAmount(int $amount): void
    {
        if ($amount < self::MIN_VND || $amount > self::MAX_VND) {
            throw ValidationException::withMessages(['payment_method' => 'VNPay yêu cầu tổng tiền từ 5.000 đ đến 9.999.999.999 đ. Hãy chọn sản phẩm hoặc phương thức khác.']);
        }
    }

    public function configured(): bool
    {
        $config = config('commerce.vnpay');

        return $config['enabled'] && filled($config['tmn_code']) && filled($config['hash_secret'])
            && $config['payment_url'] === 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
            && filter_var($config['return_url'], FILTER_VALIDATE_URL)
            && str_starts_with($config['return_url'], 'https://')
            && filter_var($config['ipn_url'], FILTER_VALIDATE_URL)
            && str_starts_with($config['ipn_url'], 'https://');
    }

    public function sign(array $fields): string
    {
        $secret = (string) config('commerce.vnpay.hash_secret');
        if ($secret === '') {
            throw new RuntimeException('VNPay chưa được cấu hình.');
        }
        $params = [];
        foreach ($fields as $key => $value) {
            if (str_starts_with((string) $key, 'vnp_') && ! in_array($key, ['vnp_SecureHash', 'vnp_SecureHashType'], true) && $value !== null && $value !== '') {
                $params[$key] = (string) $value;
            }
        }
        ksort($params, SORT_STRING);

        return hash_hmac('sha512', http_build_query($params, '', '&', PHP_QUERY_RFC1738), $secret);
    }

    public function valid(array $fields): bool
    {
        foreach ($fields as $key => $value) {
            if (str_starts_with((string) $key, 'vnp_') && ! is_string($value) && ! is_int($value)) {
                return false;
            }
        }
        $hash = $fields['vnp_SecureHash'] ?? null;

        return is_string($hash) && preg_match('/^[a-fA-F0-9]{128}$/', $hash) === 1
            && hash_equals($this->sign($fields), strtolower($hash));
    }

    public function payUrl(PaymentAttempt $attempt, string $ip): string
    {
        if (! $this->configured()) {
            throw new RuntimeException('VNPay sandbox chưa được cấu hình.');
        }
        $this->assertAmount((int) $attempt->amount_vnd);
        if (! $attempt->pay_created_at || ! $attempt->pay_expires_at || $attempt->pay_expires_at->isPast()) {
            throw ValidationException::withMessages(['payment' => 'Liên kết VNPay đã hết hạn hoặc thiếu thời gian gốc. Cần đối soát trước khi thử lại.']);
        }
        $created = $attempt->pay_created_at->copy()->setTimezone('Asia/Ho_Chi_Minh');
        $expires = $attempt->pay_expires_at->copy()->setTimezone('Asia/Ho_Chi_Minh');
        $fields = [
            'vnp_Version' => '2.1.0', 'vnp_Command' => 'pay',
            'vnp_TmnCode' => config('commerce.vnpay.tmn_code'),
            'vnp_Amount' => (string) ($attempt->amount_vnd * 100),
            'vnp_CurrCode' => 'VND', 'vnp_TxnRef' => $attempt->txn_ref,
            'vnp_OrderInfo' => 'Thanh toan don hang '.$attempt->order_id,
            'vnp_OrderType' => 'other', 'vnp_Locale' => 'vn',
            'vnp_ReturnUrl' => config('commerce.vnpay.return_url'),
            'vnp_IpAddr' => $ip, 'vnp_CreateDate' => $created->format('YmdHis'),
            'vnp_ExpireDate' => $expires->format('YmdHis'),
        ];
        $fields['vnp_SecureHash'] = $this->sign($fields);
        ksort($fields, SORT_STRING);

        return config('commerce.vnpay.payment_url').'?'.http_build_query($fields, '', '&', PHP_QUERY_RFC1738);
    }
}
