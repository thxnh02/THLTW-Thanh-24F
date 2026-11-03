<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderEventMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly int $orderId, public readonly string $title, public readonly string $message) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'CT_24F · '.$this->title);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.order-event');
    }
}
