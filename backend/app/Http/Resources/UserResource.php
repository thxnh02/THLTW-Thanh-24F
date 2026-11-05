<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'blocked_at' => $this->blocked_at,
            'orders_count' => $this->whenCounted('orders'),
            'orders' => $this->whenLoaded('orders', fn () => $this->orders->map(fn ($order) => [
                'id' => $order->id, 'status' => $order->status, 'grand_total_vnd' => $order->grand_total_vnd, 'created_at' => $order->created_at,
            ])),
            'addresses' => $this->whenLoaded('addresses', fn () => $this->addresses->map(fn ($address) => $address->only([
                'recipient_name', 'recipient_phone', 'province', 'district', 'ward', 'street', 'detail', 'is_default',
            ]))),
            'created_at' => $this->created_at,
        ];
    }
}
