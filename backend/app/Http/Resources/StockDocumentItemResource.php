<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockDocumentItemResource extends JsonResource
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
            'stock_document_id' => $this->stock_document_id,
            'product_variant_id' => $this->product_variant_id,
            'quantity' => $this->quantity,
            'unit_cost' => $this->unit_cost,
            'variant' => ProductVariantResource::make($this->whenLoaded('variant')),
        ];
    }
}
