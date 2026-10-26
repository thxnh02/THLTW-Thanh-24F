<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class PublicPostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => Str::limit(strip_tags($this->content), 160),
            'content' => $this->when($request->routeIs('public.posts.show'), $this->content),
            'created_at' => $this->created_at,
        ];
    }
}
