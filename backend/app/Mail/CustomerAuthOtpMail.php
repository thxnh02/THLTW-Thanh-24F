<?php

namespace App\Mail;

use App\Models\CustomerEmailOtp;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CustomerAuthOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $code,
        public readonly string $purpose,
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->purpose === CustomerEmailOtp::VERIFY_EMAIL
            ? 'Mã xác minh email CT_24F'
            : 'Mã đặt lại mật khẩu CT_24F';

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        $purposeLabel = $this->purpose === CustomerEmailOtp::VERIFY_EMAIL
            ? 'xác minh địa chỉ email'
            : 'đặt lại mật khẩu';

        return new Content(
            view: 'emails.customer-auth-otp',
            with: ['purposeLabel' => $purposeLabel],
        );
    }
}
