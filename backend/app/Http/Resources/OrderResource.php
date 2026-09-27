<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'user_id' => $this->user_id,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'payment_method' => $this->payment_method,
            'customer_name' => $this->customer_name,
            'customer_email' => $this->customer_email,
            'customer_phone' => $this->customer_phone,
            'shipping_address' => $this->shipping_address,
            'shipping_method_id' => $this->shipping_method_id,
            'shipping_method_name' => $this->shipping_method_name,
            'shipping_carrier' => $this->shipping_carrier,
            'tracking_code' => $this->tracking_code,
            'shipped_at' => $this->shipped_at?->toISOString(),
            'delivered_at' => $this->delivered_at?->toISOString(),
            'note' => $this->note,
            'subtotal' => $this->subtotal,
            'discount_total' => $this->discount_total,
            'shipping_fee' => $this->shipping_fee,
            'grand_total' => $this->grand_total,
            'promotion_code' => $this->promotion_code,
            'created_at' => $this->created_at?->toISOString(),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'payment' => PaymentResource::make($this->whenLoaded('payment')),
            'user' => UserResource::make($this->whenLoaded('user')),
            'histories' => OrderStatusHistoryResource::collection($this->whenLoaded('histories')),
        ];
    }
}
