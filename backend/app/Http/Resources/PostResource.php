<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
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
            'post_category_id' => $this->post_category_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content' => $this->content,
            'thumbnail' => $this->thumbnail,
            'status' => $this->status,
            'published_at' => $this->published_at?->toISOString(),
            'seo_title' => $this->seo_title,
            'seo_description' => $this->seo_description,
            'category' => PostCategoryResource::make($this->whenLoaded('category')),
        ];
    }
}
