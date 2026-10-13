<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReturnRequestResource extends JsonResource
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
            'order_id' => $this->order_id,
            'user_id' => $this->user_id,
            'reason' => $this->reason,
            'description' => $this->description,
            'status' => $this->status,
            'refund_status' => $this->refund_status,
            'admin_note' => $this->admin_note,
            'created_at' => $this->created_at?->toISOString(),
            'items' => ReturnRequestItemResource::collection($this->whenLoaded('items')),
            'order' => OrderResource::make($this->whenLoaded('order')),
            'user' => UserResource::make($this->whenLoaded('user')),
        ];
    }
}
