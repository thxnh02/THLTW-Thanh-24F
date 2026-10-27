<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Minimal, public product data for the storefront's type-ahead suggestions. */
class ProductSuggestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'image' => $this->image,
            'price' => $this->price,
            'sale_price' => $this->sale_price,
            'brand' => $this->whenLoaded('brand', fn () => $this->brand?->name),
        ];
    }
}
