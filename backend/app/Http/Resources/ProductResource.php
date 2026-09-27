<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $defaultVariant = $this->relationLoaded('defaultVariant') ? $this->defaultVariant : null;
        $variant = $defaultVariant ?: ($this->relationLoaded('variants') ? $this->variants->firstWhere('is_default', true) : null);
        $primaryImage = $this->relationLoaded('primaryImage') ? $this->primaryImage : ($this->relationLoaded('images') ? $this->images->firstWhere('is_primary', true) : null);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'status' => $this->status,
            'featured' => (bool) $this->featured,
            'sold_count' => $this->sold_count,
            'seo_title' => $this->seo_title,
            'seo_description' => $this->seo_description,
            'category' => CategoryResource::make($this->whenLoaded('category')),
            'brand' => BrandResource::make($this->whenLoaded('brand')),
            'primary_image' => $primaryImage?->path,
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'default_variant' => ProductVariantResource::make($variant),
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            'price' => $variant?->price,
            'sale_price' => $variant?->sale_price,
            'stock_quantity' => $variant?->stock_quantity ?? 0,
            'review_count' => (int) ($this->reviews_count ?? ($this->relationLoaded('reviews') ? $this->reviews->count() : 0)),
            'reviews_count' => (int) ($this->reviews_count ?? ($this->relationLoaded('reviews') ? $this->reviews->count() : 0)),
            'average_rating' => round((float) ($this->reviews_avg_rating ?? ($this->relationLoaded('reviews') ? $this->reviews->avg('rating') : 0)), 1),
            'reviews' => ReviewResource::collection($this->whenLoaded('reviews')),
            'related_products' => ProductResource::collection($this->whenLoaded('related_products')),
        ];
    }
}
