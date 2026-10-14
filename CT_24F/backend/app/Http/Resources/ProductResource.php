<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'name' => $this->name, 'slug' => $this->slug, 'description' => $this->description, 'image' => $this->image, 'price' => $this->price, 'status' => $this->when(request()->is('api/admin/*'), $this->status), 'deleted_at' => $this->when(request()->is('api/admin/*'), $this->deleted_at), 'category' => new CategoryResource($this->whenLoaded('category')), 'brand' => new BrandResource($this->whenLoaded('brand'))];
    }
}
