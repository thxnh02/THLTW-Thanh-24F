<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'status' => $this->status,
            'order_code' => $this->order_code,
            'shipping_snapshot' => $this->shipping_snapshot,
            'subtotal_vnd' => $this->subtotal_vnd,
            'shipping_fee_vnd' => $this->shipping_fee_vnd,
            'grand_total_vnd' => $this->grand_total_vnd,
            'payment_method' => $this->payment_method,
            'payment_status' => $this->payment_status,
            'payment_review_required' => (bool) $this->payment_review_required,
            'customer_note' => $this->customer_note,
            'items' => $this->whenLoaded('items'),
            'payment_attempts' => $this->whenLoaded('paymentAttempts'),
            'payment_events' => $this->whenLoaded('paymentEvents'),
            'allowed_next_statuses' => $this->payment_method === 'vnpay' && $this->payment_status !== 'paid' ? [] : $this->allowedNextStatuses(),
            'user' => new UserResource($this->whenLoaded('user')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
