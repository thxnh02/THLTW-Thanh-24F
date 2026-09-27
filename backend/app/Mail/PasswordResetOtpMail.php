<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $code) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Ma OTP dat lai mat khau');
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.password-reset-otp', with: ['code' => $this->code, 'expiresInMinutes' => 10]);
    }
}
