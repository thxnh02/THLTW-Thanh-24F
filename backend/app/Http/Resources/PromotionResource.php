<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PromotionResource extends JsonResource
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
            'code' => $this->code,
            'type' => $this->type,
            'applies_to' => $this->applies_to,
            'value' => $this->value,
            'min_order_amount' => $this->min_order_amount,
            'max_discount_amount' => $this->max_discount_amount,
            'first_order_only' => (bool) $this->first_order_only,
            'free_shipping' => (bool) $this->free_shipping,
            'min_quantity' => $this->min_quantity,
            'start_at' => $this->start_at?->toISOString(),
            'end_at' => $this->end_at?->toISOString(),
            'active' => (bool) $this->active,
            'usage_limit' => $this->usage_limit,
            'used_count' => $this->used_count,
            'usage_limit_per_user' => $this->usage_limit_per_user,
            'products' => ProductResource::collection($this->whenLoaded('products')),
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'brands' => BrandResource::collection($this->whenLoaded('brands')),
            'usages_count' => $this->when(isset($this->usages_count), $this->usages_count),
        ];
    }
}
