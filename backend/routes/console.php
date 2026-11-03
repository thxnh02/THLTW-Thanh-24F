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
    $this->comment('Cá»­a hÃ ng CT_24F sáºµn sÃ ng.');
})->purpose('Hiá»ƒn thá»‹ tráº¡ng thÃ¡i dá»± Ã¡n CT_24F');

Artisan::command('commerce:reconcile-pending {--execute : Thá»±c sá»± gá»i QueryDr vÃ  ghi káº¿t quáº£} {--limit=20 : Sá»‘ giao dá»‹ch tá»‘i Ä‘a} {--order-id= : Chá»‰ kiá»ƒm tra má»™t Ä‘Æ¡n}', function (VnPayReconciler $reconciler): void {
    $limit = max(1, min(100, (int) $this->option('limit')));
    $orderId = $this->option('order-id');
    $query = PaymentAttempt::query()->where('provider', 'vnpay')->whereIn('state', ['pending', 'needs_review'])
        ->where(fn ($q) => $q->where('pay_expires_at', '<=', now())
            ->orWhere(fn ($legacy) => $legacy->whereNull('pay_expires_at')->where('created_at', '<=', now()->subMinutes(15))))
        ->orderBy('id');
    if ($orderId !== null && $orderId !== '') {
        if (! ctype_digit((string) $orderId)) {
            $this->error('order-id pháº£i lÃ  sá»‘ nguyÃªn dÆ°Æ¡ng.');

            return;
        }
        $query->where('order_id', (int) $orderId);
    }
    $attempts = $query->limit($limit)->get();
    $this->info('Giao dá»‹ch cáº§n Ä‘á»‘i soÃ¡t: '.$attempts->count().($this->option('execute') ? ' (thá»±c thi)' : ' (xem trÆ°á»›c)'));
    foreach ($attempts as $attempt) {
        $outcome = $this->option('execute') ? $reconciler->reconcile($attempt->id) : 'dry-run';
        $this->line('ÄÆ¡n #'.$attempt->order_id.' / giao dá»‹ch #'.$attempt->id.': '.$outcome);
        if ($this->option('execute')) {
            usleep(500000); // avoid a burst of QueryDr calls
        }
    }
})->purpose('Äá»‘i soÃ¡t cÃ³ kiá»ƒm soÃ¡t cÃ¡c giao dá»‹ch VNPay quÃ¡ háº¡n; máº·c Ä‘á»‹nh chá»‰ xem trÆ°á»›c');

Artisan::command('commerce:check-vnpay {--check-ipn : Gá»­i GET khÃ´ng cÃ³ dá»¯ liá»‡u thanh toÃ¡n Ä‘á»ƒ kiá»ƒm tra route callback cÃ´ng khai}', function (): int {
    $pass = fn (string $message) => $this->line('<info>[OK]</info> '.$message);
    $check = fn (string $message) => $this->line('<comment>[CHECK]</comment> '.$message);
    $fail = fn (string $message) => $this->line('<error>[FAIL]</error> '.$message);
    $allPassed = true;
    $config = config('commerce.vnpay');

    if (is_string($config['tmn_code'] ?? null) && preg_match('/^[A-Za-z0-9]{8}$/', $config['tmn_code'])) {
        $pass('Merchant ID Ä‘Ã£ Ä‘Æ°á»£c cáº¥u hÃ¬nh Ä‘Ãºng Ä‘á»‹nh dáº¡ng.');
    } else {
        $fail('Thiáº¿u Merchant ID sandbox hoáº·c Ä‘á»‹nh dáº¡ng khÃ´ng há»£p lá»‡.');
        $allPassed = false;
    }
    if (filled($config['hash_secret'] ?? null)) {
        $pass('Checksum secret Ä‘Ã£ cÃ³ (khÃ´ng hiá»ƒn thá»‹ giÃ¡ trá»‹).');
    } else {
        $fail('Thiáº¿u checksum secret sandbox.');
        $allPassed = false;
    }
    if (($config['payment_url'] ?? null) === 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html') {
        $pass('Payment endpoint lÃ  endpoint Sandbox chÃ­nh thá»©c.');
    } else {
        $fail('Payment endpoint khÃ´ng khá»›p endpoint Sandbox chÃ­nh thá»©c.');
        $allPassed = false;
    }
    foreach (['return_url' => 'Return URL', 'ipn_url' => 'IPN URL'] as $key => $label) {
        $url = $config[$key] ?? null;
        if (is_string($url) && filter_var($url, FILTER_VALIDATE_URL) && parse_url($url, PHP_URL_SCHEME) === 'https') {
            $pass($label.' lÃ  HTTPS há»£p lá»‡.');
        } else {
            $fail($label.' cáº§n lÃ  URL HTTPS cÃ´ng khai.');
            $allPassed = false;
        }
    }
    if ($config['enabled'] ?? false) {
        $pass('VNPAY_ENABLED Ä‘ang báº­t á»Ÿ cáº¥u hÃ¬nh runtime.');
    } else {
        $check('Thanh toÃ¡n VNPay hiá»‡n Ä‘ang táº¯t á»Ÿ cáº¥u hÃ¬nh runtime.');
        $allPassed = false;
    }
    if (app()->configurationIsCached()) {
        $check('Laravel Ä‘ang dÃ¹ng config cache; sau khi Ä‘á»•i .env hÃ£y cháº¡y config:clear rá»“i config:cache.');
    } else {
        $pass('Config cache Ä‘ang táº¯t; Laravel náº¡p cáº¥u hÃ¬nh hiá»‡n táº¡i khi khá»Ÿi Ä‘á»™ng.');
    }
    $check('XÃ¡c nháº­n Return/IPN URL vÃ  Terminal ID Ä‘Ã£ Ä‘Æ°á»£c Ä‘Äƒng kÃ½ hoáº·c cho phÃ©p trong merchant portal VNPay.');

    if ($this->option('check-ipn')) {
        $url = $config['ipn_url'] ?? null;
        $host = is_string($url) ? parse_url($url, PHP_URL_HOST) : null;
        $path = is_string($url) ? parse_url($url, PHP_URL_PATH) : null;
        $addresses = is_string($host) ? dns_get_record($host, DNS_A | DNS_AAAA) : [];
        $ips = array_values(array_filter(array_map(fn (array $record) => $record['ip'] ?? $record['ipv6'] ?? null, $addresses)));
        $publicHost = $ips !== [] && collect($ips)->every(fn (string $ip) => filter_var($ip,
            FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false);
        if (! $publicHost || $path !== '/api/payments/vnpay/ipn' || ! is_string($url)) {
            $fail('KhÃ´ng kiá»ƒm tra callback: host cáº§n phÃ¢n giáº£i ra IP cÃ´ng khai vÃ  Ä‘Ãºng Ä‘Æ°á»ng dáº«n IPN.');
            $allPassed = false;
        } else {
            try {
                $response = Http::connectTimeout(3)->timeout(5)->withoutRedirecting()->get($url);
                $code = $response->json('RspCode');
                if ($response->successful() && in_array($code, ['97', '04', '01', '99'], true)) {
                    $pass('IPN endpoint cÃ´ng khai Ä‘Ã£ pháº£n há»“i; request kiá»ƒm tra khÃ´ng chá»©a dá»¯ liá»‡u giao dá»‹ch.');
                } else {
                    $fail('IPN endpoint khÃ´ng tráº£ mÃ£ pháº£n há»“i dá»± kiáº¿n; kiá»ƒm tra proxy vÃ  Laravel route.');
                    $allPassed = false;
                }
            } catch (Throwable) {
                $fail('KhÃ´ng thá»ƒ káº¿t ná»‘i IPN endpoint; kiá»ƒm tra DNS, TLS, tunnel vÃ  firewall.');
                $allPassed = false;
            }
        }
    } else {
        $check('ChÆ°a thá»­ káº¿t ná»‘i ngoÃ i tá»›i IPN; thÃªm --check-ipn sau khi Ä‘Ã£ má»Ÿ host HTTPS.');
    }

    if ($config['query_enabled'] ?? false) {
        $queryIp = $config['query_ip'] ?? null;
        if (is_string($queryIp) && filter_var($queryIp, FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
            $pass('Äá»‹a chá»‰ IP QueryDr Ä‘Ã£ khai bÃ¡o lÃ  IP cÃ´ng khai.');
        } else {
            $fail('QueryDr Ä‘ang báº­t nhÆ°ng IP gá»i API chÆ°a pháº£i IP cÃ´ng khai há»£p lá»‡.');
            $allPassed = false;
        }
        if (($config['query_url'] ?? null) === 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction') {
            $pass('QueryDr dÃ¹ng Ä‘Ãºng endpoint Sandbox.');
        } else {
            $fail('QueryDr endpoint khÃ´ng khá»›p endpoint Sandbox.');
            $allPassed = false;
        }
    } else {
        $check('QueryDr Ä‘ang táº¯t; chá»‰ báº­t khi merchant Ä‘Ã£ Ä‘Æ°á»£c cáº¥p quyá»n vÃ  cáº¥u hÃ¬nh IP cho phÃ©p.');
    }

    return $allPassed ? self::SUCCESS : self::FAILURE;
})->purpose('Kiá»ƒm tra cáº¥u hÃ¬nh VNPay Sandbox mÃ  khÃ´ng in thÃ´ng tin bÃ­ máº­t');

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
        $this->line('<comment>[CHECK]</comment> Config cache Ä‘ang báº­t; sau khi sá»­a .env cáº§n náº¡p láº¡i config.');
    }
    $this->comment('Lá»‡nh nÃ y chá»‰ kiá»ƒm tra cáº¥u hÃ¬nh; khÃ´ng gá»­i email vÃ  khÃ´ng hiá»ƒn thá»‹ Ä‘á»‹a chá»‰/máº­t kháº©u.');

    return $allPassed ? self::SUCCESS : self::FAILURE;
})->purpose('Kiá»ƒm tra SMTP Ä‘Ã£ cáº¥u hÃ¬nh mÃ  khÃ´ng gá»­i thÆ° hoáº·c in thÃ´ng tin bÃ­ máº­t');

Artisan::command('commerce:mail-test {recipient : Email do báº¡n kiá»ƒm soÃ¡t Ä‘á»ƒ nháº­n Ä‘Ãºng má»™t thÆ° kiá»ƒm tra}', function (): int {
    if (! app()->environment(['local', 'testing'])) {
        $this->error('Lá»‡nh gá»­i thÆ° kiá»ƒm tra chá»‰ cháº¡y á»Ÿ local/testing.');

        return self::FAILURE;
    }
    $recipient = (string) $this->argument('recipient');
    $mailer = (string) config('mail.default');
    if (! filter_var($recipient, FILTER_VALIDATE_EMAIL) || $mailer !== 'smtp'
        || ! filled(config('mail.mailers.smtp.host')) || ! filled(config('mail.mailers.smtp.username'))
        || ! filled(config('mail.mailers.smtp.password')) || ! filled(config('mail.from.address'))) {
        $this->error('Email nháº­n hoáº·c cáº¥u hÃ¬nh SMTP chÆ°a há»£p lá»‡. KhÃ´ng cÃ³ thÆ° nÃ o Ä‘Æ°á»£c gá»­i.');

        return self::FAILURE;
    }
    try {
        Mail::mailer('smtp')->to($recipient)->send(new SmtpHealthCheckMail);
    } catch (Throwable $exception) {
        Log::warning('SMTP health-check email was not accepted.', ['error_type' => $exception::class]);
        $this->error('SMTP chÆ°a cháº¥p nháº­n thÆ°. Kiá»ƒm tra host, cá»•ng, TLS vÃ  máº­t kháº©u á»©ng dá»¥ng; thÃ´ng tin bÃ­ máº­t khÃ´ng Ä‘Æ°á»£c in ra.');

        return self::FAILURE;
    }

    $this->info('SMTP Ä‘Ã£ cháº¥p nháº­n thÆ° kiá»ƒm tra. HÃ£y kiá»ƒm tra cáº£ há»™p thÆ° Ä‘áº¿n vÃ  thÆ° rÃ¡c; tráº¡ng thÃ¡i nÃ y chÆ°a xÃ¡c nháº­n thÆ° Ä‘Ã£ vÃ o inbox.');

    return self::SUCCESS;
})->purpose('Gá»­i Ä‘Ãºng má»™t email kiá»ƒm tra SMTP tá»›i Ä‘á»‹a chá»‰ do ngÆ°á»i cháº¡y chá»‰ Ä‘á»‹nh');

Artisan::command('commerce:retry-order-emails {--execute : Queue eligible order emails} {--limit=20 : Maximum notifications to inspect}', function (OrderNotificationDelivery $delivery): int {
    if (! config('commerce.order_email_enabled')) {
        $this->error('ORDER_EMAIL_ENABLED is disabled.');

        return self::FAILURE;
    }
    $limit = max(1, min(100, (int) $this->option('limit')));
    $maxAttempts = (int) config('commerce.order_email_max_attempts', 3);
    $backoff = config('commerce.order_email_backoff_seconds', [60, 300, 900]);
    $staleBefore = now()->subSeconds((int) config('commerce.order_email_stale_after_seconds', 300));
    $eligibleRecipient = function ($query, string $statusColumn, string $countColumn, string $attemptedColumn) use ($maxAttempts, $backoff, $staleBefore): void {
        $query->where(function ($eligible) use ($statusColumn, $countColumn, $attemptedColumn, $maxAttempts, $backoff, $staleBefore): void {
            $eligible->where(fn ($pending) => $pending->where($statusColumn, 'pending')->where($countColumn, 0))
                ->orWhere(function ($failed) use ($statusColumn, $countColumn, $attemptedColumn, $maxAttempts, $backoff): void {
                    $failed->where($statusColumn, 'failed')->where($countColumn, '<', $maxAttempts)
                        ->where(function ($due) use ($countColumn, $attemptedColumn, $maxAttempts, $backoff): void {
                            for ($attempt = 1; $attempt < $maxAttempts; $attempt++) {
                                $delay = (int) ($backoff[min($attempt - 1, count($backoff) - 1)] ?? 900);
                                $due->orWhere(fn ($count) => $count->where($countColumn, $attempt)
                                    ->where($attemptedColumn, '<=', now()->subSeconds($delay)));
                            }
                        });
                })
                ->orWhere(fn ($attempted) => $attempted->where($statusColumn, 'attempted')
                    ->where($countColumn, '<', $maxAttempts)->where($attemptedColumn, '<=', $staleBefore));
        });
    };
    $notifications = CustomerNotification::query()->whereHas('order')->where(function ($query) use ($eligibleRecipient): void {
        $eligibleRecipient($query, 'email_status', 'email_attempt_count', 'email_attempted_at');
        $query->orWhere(fn ($admin) => $eligibleRecipient($admin, 'admin_email_status', 'admin_email_attempt_count', 'admin_email_attempted_at'));
    })->orderBy('id')->limit($limit)->get();
    $this->info('Eligible order email notifications: '.$notifications->count().($this->option('execute') ? ' (queueing)' : ' (dry run)'));
    foreach ($notifications as $notification) {
        if (! $this->option('execute')) {
            $this->line('Notification #'.$notification->id.': eligible for retry');

            continue;
        }
        $queued = $delivery->enqueue($notification->id, retry: true);
        $this->line('Notification #'.$notification->id.': '.($queued ? 'queued' : 'queue unavailable; state remains recoverable'));
        usleep(300000);
    }

    return self::SUCCESS;
})->purpose('Inspect or queue due order email deliveries; defaults to a dry run');
