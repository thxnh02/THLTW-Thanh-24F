<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryMovementResource extends JsonResource
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
            'product_variant_id' => $this->product_variant_id,
            'quantity_change' => $this->quantity_change,
            'balance_after' => $this->balance_after,
            'reason' => $this->reason,
            'source_type' => $this->source_type,
            'source_id' => $this->source_id,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at?->toISOString(),
            'variant' => ProductVariantResource::make($this->whenLoaded('variant')),
            'creator' => UserResource::make($this->whenLoaded('creator')),
        ];
    }
}
