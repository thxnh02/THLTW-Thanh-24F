<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantOptionResource extends JsonResource
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
            'sku' => $this->sku,
            'name' => $this->name ?: $this->sku,
            'stock_quantity' => (int) $this->stock_quantity,
            'active' => (bool) $this->active,
            'product' => [
                'id' => $this->product->id,
                'name' => $this->product->name,
            ],
        ];
    }
}
