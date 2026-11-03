<?php

use App\Models\PaymentAttempt;
use App\Support\VnPayReconciler;
use Illuminate\Support\Facades\Artisan;

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
