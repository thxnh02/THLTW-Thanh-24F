<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'parent_id' => $this->parent_id, 'name' => $this->name, 'slug' => $this->slug, 'description' => $this->description, 'image' => $this->image, 'sort_order' => $this->sort_order, 'status' => $this->status, 'parent' => new self($this->whenLoaded('parent')), 'children' => self::collection($this->whenLoaded('children'))];
    }
}
