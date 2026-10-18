<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Product JSON shape shared by storefront reads and admin catalog endpoints. */
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $admin = $request->is('api/admin/*');

        return [
            'id' => $this->id,
            'category_id' => $this->when($admin, $this->category_id),
            'brand_id' => $this->when($admin, $this->brand_id),
            'sku' => $this->sku,
            'name' => $this->name,
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'image' => $this->image,
            'thumbnail_url' => $this->image ? url($this->image) : null,
            'price' => $this->price,
            'sale_price' => $this->sale_price,
            'final_price' => $this->sale_price ?? $this->price,
            'quantity' => $this->quantity,
            'is_featured' => $this->is_featured,
            'status' => $this->when($admin, $this->status),
            'deleted_at' => $this->when($admin, $this->deleted_at),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'brand' => new BrandResource($this->whenLoaded('brand')),
        ];
    }
}
