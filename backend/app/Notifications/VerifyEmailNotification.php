<?php

namespace App\Notifications;

use App\Models\EmailVerificationCode;
use App\Models\Setting;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends Notification
{
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $shopName = $this->shopName();
        $verificationCode = $this->issueCode($notifiable);
        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ],
        );

        return (new MailMessage)
            ->from((string) config('mail.from.address'), $shopName)
            ->subject('Xác nhận email - '.$shopName)
            ->greeting('Xin chào '.($notifiable->name ?: 'bạn').',')
            ->line('Cảm ơn bạn đã đăng ký tài khoản tại '.$shopName.'.')
            ->line('Bạn có thể xác nhận email bằng mã 6 số hoặc nút liên kết bên dưới.')
            ->line('Mã xác nhận của bạn: **'.$verificationCode.'**')
            ->action('Xác nhận email', $verificationUrl)
            ->line('Mã có hiệu lực trong 15 phút. Liên kết có hiệu lực trong 60 phút.')
            ->line('Nếu nút xác nhận không hoạt động, bạn có thể mở liên kết sau:')
            ->line($verificationUrl)
            ->salutation('Trân trọng, '.$shopName);
    }

    private function issueCode(object $notifiable): string
    {
        EmailVerificationCode::query()
            ->where('user_id', $notifiable->getKey())
            ->whereNull('used_at')
            ->update(['used_at' => now()]);

        $code = (string) random_int(100000, 999999);

        EmailVerificationCode::query()->create([
            'user_id' => $notifiable->getKey(),
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(15),
        ]);

        return $code;
    }

    private function shopName(): string
    {
        return (string) (Setting::query()->where('key', 'website_name')->value('value') ?: config('app.name', 'Cửa hàng'));
    }
}
