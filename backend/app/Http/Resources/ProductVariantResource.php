<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
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
            'product_id' => $this->product_id,
            'sku' => $this->sku,
            'name' => $this->name,
            'attributes' => $this->attributes,
            'price' => $this->price,
            'sale_price' => $this->sale_price,
            'stock_quantity' => $this->stock_quantity,
            'active' => (bool) $this->active,
            'is_default' => (bool) $this->is_default,
        ];
    }
}
