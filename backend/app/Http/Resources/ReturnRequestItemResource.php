<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReturnRequestItemResource extends JsonResource
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
            'return_request_id' => $this->return_request_id,
            'order_item_id' => $this->order_item_id,
            'quantity' => $this->quantity,
            'reason' => $this->reason,
            'condition_note' => $this->condition_note,
            'order_item' => OrderItemResource::make($this->whenLoaded('orderItem')),
        ];
    }
}
