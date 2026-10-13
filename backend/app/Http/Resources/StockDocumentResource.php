<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockDocumentResource extends JsonResource
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
            'type' => $this->type,
            'code' => $this->code,
            'supplier' => $this->supplier,
            'reason' => $this->reason,
            'note' => $this->note,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at?->toISOString(),
            'items' => StockDocumentItemResource::collection($this->whenLoaded('items')),
            'creator' => UserResource::make($this->whenLoaded('creator')),
        ];
    }
}
