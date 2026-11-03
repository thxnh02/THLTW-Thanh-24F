<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderEventMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly Order $order, public readonly string $title, public readonly string $eventMessage) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'CT_24F · '.$this->title);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.order-event', with: [
            'order' => $this->order,
            'title' => $this->title,
            'eventMessage' => $this->eventMessage,
        ]);
    }
}
