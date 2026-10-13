<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'name' => $this->name, 'slug' => $this->slug, 'description' => $this->description, 'image' => $this->image, 'price' => $this->price, 'category' => new CategoryResource($this->whenLoaded('category')), 'brand' => new BrandResource($this->whenLoaded('brand'))];
    }
}
