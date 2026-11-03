<?php

use App\Mail\SmtpHealthCheckMail;
use App\Models\CustomerNotification;
use App\Models\PaymentAttempt;
use App\Support\OrderNotificationDelivery;
use App\Support\VnPayReconciler;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

Artisan::command('inspire', function (): void {
    $this->comment('Cửa hàng CT_24F sẵn sàng.');
})->purpose('Hiển thị trạng thái dự án CT_24F');

Artisan::command('commerce:reconcile-pending {--execute : Thực sự gọi QueryDr và ghi kết quả} {--limit=20 : Số giao dịch tối đa} {--order-id= : Chỉ kiểm tra một đơn}', function (VnPayReconciler $reconciler): void {
    $limit = max(1, min(100, (int) $this->option('limit')));
    $orderId = $this->option('order-id');
    $query = PaymentAttempt::query()->where('provider', 'vnpay')->whereIn('state', ['pending', 'needs_review'])
        ->where(fn ($q) => $q->where('pay_expires_at', '<=', now())
            ->orWhere(fn ($legacy) => $legacy->whereNull('pay_expires_at')->where('created_at', '<=', now()->subMinutes(15))))
        ->orderBy('id');
    if ($orderId !== null && $orderId !== '') {
        if (! ctype_digit((string) $orderId)) {
            $this->error('order-id phải là số nguyên dương.');

            return;
        }
        $query->where('order_id', (int) $orderId);
    }
    $attempts = $query->limit($limit)->get();
    $this->info('Giao dịch cần đối soát: '.$attempts->count().($this->option('execute') ? ' (thực thi)' : ' (xem trước)'));
    foreach ($attempts as $attempt) {
        $outcome = $this->option('execute') ? $reconciler->reconcile($attempt->id) : 'dry-run';
        $this->line('Đơn #'.$attempt->order_id.' / giao dịch #'.$attempt->id.': '.$outcome);
        if ($this->option('execute')) {
            usleep(500000); // avoid a burst of QueryDr calls
        }
    }
})->purpose('Đối soát có kiểm soát các giao dịch VNPay quá hạn; mặc định chỉ xem trước');

Artisan::command('commerce:check-vnpay {--check-ipn : Gửi GET không có dữ liệu thanh toán để kiểm tra route callback công khai}', function (): int {
    $pass = fn (string $message) => $this->line('<info>[OK]</info> '.$message);
    $check = fn (string $message) => $this->line('<comment>[CHECK]</comment> '.$message);
    $fail = fn (string $message) => $this->line('<error>[FAIL]</error> '.$message);
    $allPassed = true;
    $config = config('commerce.vnpay');

    if (is_string($config['tmn_code'] ?? null) && preg_match('/^[A-Za-z0-9]{8}$/', $config['tmn_code'])) {
        $pass('Merchant ID đã được cấu hình đúng định dạng.');
    } else {
        $fail('Thiếu Merchant ID sandbox hoặc định dạng không hợp lệ.');
        $allPassed = false;
    }
    if (filled($config['hash_secret'] ?? null)) {
        $pass('Checksum secret đã có (không hiển thị giá trị).');
    } else {
        $fail('Thiếu checksum secret sandbox.');
        $allPassed = false;
    }
    if (($config['payment_url'] ?? null) === 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html') {
        $pass('Payment endpoint là endpoint Sandbox chính thức.');
    } else {
        $fail('Payment endpoint không khớp endpoint Sandbox chính thức.');
        $allPassed = false;
    }
    foreach (['return_url' => 'Return URL', 'ipn_url' => 'IPN URL'] as $key => $label) {
        $url = $config[$key] ?? null;
        if (is_string($url) && filter_var($url, FILTER_VALIDATE_URL) && parse_url($url, PHP_URL_SCHEME) === 'https') {
            $pass($label.' là HTTPS hợp lệ.');
        } else {
            $fail($label.' cần là URL HTTPS công khai.');
            $allPassed = false;
        }
    }
    if ($config['enabled'] ?? false) {
        $pass('VNPAY_ENABLED đang bật ở cấu hình runtime.');
    } else {
        $check('Thanh toán VNPay hiện đang tắt ở cấu hình runtime.');
        $allPassed = false;
    }
    if (app()->configurationIsCached()) {
        $check('Laravel đang dùng config cache; sau khi đổi .env hãy chạy config:clear rồi config:cache.');
    } else {
        $pass('Config cache đang tắt; Laravel nạp cấu hình hiện tại khi khởi động.');
    }
    $check('Xác nhận Return/IPN URL và Terminal ID đã được đăng ký hoặc cho phép trong merchant portal VNPay.');

    if ($this->option('check-ipn')) {
        $url = $config['ipn_url'] ?? null;
        $host = is_string($url) ? parse_url($url, PHP_URL_HOST) : null;
        $path = is_string($url) ? parse_url($url, PHP_URL_PATH) : null;
        $addresses = is_string($host) ? dns_get_record($host, DNS_A | DNS_AAAA) : [];
        $ips = array_values(array_filter(array_map(fn (array $record) => $record['ip'] ?? $record['ipv6'] ?? null, $addresses)));
        $publicHost = $ips !== [] && collect($ips)->every(fn (string $ip) => filter_var($ip,
            FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false);
        if (! $publicHost || $path !== '/api/payments/vnpay/ipn' || ! is_string($url)) {
            $fail('Không kiểm tra callback: host cần phân giải ra IP công khai và đúng đường dẫn IPN.');
            $allPassed = false;
        } else {
            try {
                $response = Http::connectTimeout(3)->timeout(5)->withoutRedirecting()->get($url);
                $code = $response->json('RspCode');
                if ($response->successful() && in_array($code, ['97', '04', '01', '99'], true)) {
                    $pass('IPN endpoint công khai đã phản hồi; request kiểm tra không chứa dữ liệu giao dịch.');
                } else {
                    $fail('IPN endpoint không trả mã phản hồi dự kiến; kiểm tra proxy và Laravel route.');
                    $allPassed = false;
                }
            } catch (Throwable) {
                $fail('Không thể kết nối IPN endpoint; kiểm tra DNS, TLS, tunnel và firewall.');
                $allPassed = false;
            }
        }
    } else {
        $check('Chưa thử kết nối ngoài tới IPN; thêm --check-ipn sau khi đã mở host HTTPS.');
    }

    if ($config['query_enabled'] ?? false) {
        $queryIp = $config['query_ip'] ?? null;
        if (is_string($queryIp) && filter_var($queryIp, FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
            $pass('Địa chỉ IP QueryDr đã khai báo là IP công khai.');
        } else {
            $fail('QueryDr đang bật nhưng IP gọi API chưa phải IP công khai hợp lệ.');
            $allPassed = false;
        }
        if (($config['query_url'] ?? null) === 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction') {
            $pass('QueryDr dùng đúng endpoint Sandbox.');
        } else {
            $fail('QueryDr endpoint không khớp endpoint Sandbox.');
            $allPassed = false;
        }
    } else {
        $check('QueryDr đang tắt; chỉ bật khi merchant đã được cấp quyền và cấu hình IP cho phép.');
    }

    return $allPassed ? self::SUCCESS : self::FAILURE;
})->purpose('Kiểm tra cấu hình VNPay Sandbox mà không in thông tin bí mật');

Artisan::command('commerce:check-mail', function (): int {
    $checks = [
        'SMTP mailer selected' => config('mail.default') === 'smtp',
        'SMTP host configured' => filled(config('mail.mailers.smtp.host')),
        'SMTP port configured' => filled(config('mail.mailers.smtp.port')),
        'SMTP username configured' => filled(config('mail.mailers.smtp.username')),
        'SMTP password configured' => filled(config('mail.mailers.smtp.password')),
        'Sender address configured' => filled(config('mail.from.address'))
            && filter_var(config('mail.from.address'), FILTER_VALIDATE_EMAIL) !== false,
    ];
    $allPassed = true;
    foreach ($checks as $label => $passed) {
        if ($passed) {
            $this->line('<info>[OK]</info> '.$label.'.');
        } else {
            $this->line('<error>[FAIL]</error> '.$label.'.');
            $allPassed = false;
        }
    }
    if (config('commerce.order_email_enabled')) {
        $this->line('<info>[OK]</info> Order email notifications are enabled.');
    } else {
        $this->line('<comment>[CHECK]</comment> Order email notifications are disabled.');
    }
    if (app()->configurationIsCached()) {
        $this->line('<comment>[CHECK]</comment> Config cache đang bật; sau khi sửa .env cần nạp lại config.');
    }
    $this->comment('Lệnh này chỉ kiểm tra cấu hình; không gửi email và không hiển thị địa chỉ/mật khẩu.');

    return $allPassed ? self::SUCCESS : self::FAILURE;
})->purpose('Kiểm tra SMTP đã cấu hình mà không gửi thư hoặc in thông tin bí mật');

Artisan::command('commerce:mail-test {recipient : Email do bạn kiểm soát để nhận đúng một thư kiểm tra}', function (): int {
    if (! app()->environment(['local', 'testing'])) {
        $this->error('Lệnh gửi thư kiểm tra chỉ chạy ở local/testing.');

        return self::FAILURE;
    }
    $recipient = (string) $this->argument('recipient');
    $mailer = (string) config('mail.default');
    if (! filter_var($recipient, FILTER_VALIDATE_EMAIL) || $mailer !== 'smtp'
        || ! filled(config('mail.mailers.smtp.host')) || ! filled(config('mail.mailers.smtp.username'))
        || ! filled(config('mail.mailers.smtp.password')) || ! filled(config('mail.from.address'))) {
        $this->error('Email nhận hoặc cấu hình SMTP chưa hợp lệ. Không có thư nào được gửi.');

        return self::FAILURE;
    }
    try {
        Mail::mailer('smtp')->to($recipient)->send(new SmtpHealthCheckMail);
    } catch (Throwable $exception) {
        Log::warning('SMTP health-check email was not accepted.', ['error_type' => $exception::class]);
        $this->error('SMTP chưa chấp nhận thư. Kiểm tra host, cổng, TLS và mật khẩu ứng dụng; thông tin bí mật không được in ra.');

        return self::FAILURE;
    }

    $this->info('SMTP đã chấp nhận thư kiểm tra. Hãy kiểm tra cả hộp thư đến và thư rác; trạng thái này chưa xác nhận thư đã vào inbox.');

    return self::SUCCESS;
})->purpose('Gửi đúng một email kiểm tra SMTP tới địa chỉ do người chạy chỉ định');

Artisan::command('commerce:retry-order-emails {--execute : Thực sự gửi các thư lỗi quá hạn} {--limit=20 : Số thông báo tối đa}', function (OrderNotificationDelivery $delivery): int {
    if (! config('commerce.order_email_enabled')) {
        $this->error('ORDER_EMAIL_ENABLED hiện đang tắt.');

        return self::FAILURE;
    }
    $limit = max(1, min(100, (int) $this->option('limit')));
    $notifications = CustomerNotification::query()->where(function ($query): void {
        $query->where(function ($customer): void {
            $customer->whereIn('email_status', ['failed', 'attempted'])->where('email_attempt_count', '<', 3);
        })->orWhere(function ($admin): void {
            $admin->whereIn('admin_email_status', ['failed', 'attempted'])->where('admin_email_attempt_count', '<', 3);
        });
    })->whereHas('order')->orderBy('id')->limit($limit)->get();
    $this->info('Thông báo cần rà soát: '.$notifications->count().($this->option('execute') ? ' (thực thi)' : ' (xem trước)'));
    foreach ($notifications as $notification) {
        if (! $this->option('execute')) {
            $this->line('Thông báo #'.$notification->id.': cần kiểm tra thử lại');

            continue;
        }
        $result = $delivery->retry($notification->id);
        $this->line('Thông báo #'.$notification->id.': khách '.$result['customer'].' · admin '.$result['admin']);
        usleep(300000);
    }

    return self::SUCCESS;
})->purpose('Thử lại tối đa ba lần các email đơn hàng lỗi; mặc định chỉ xem trước');
