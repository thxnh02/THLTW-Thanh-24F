<?php

namespace App\Models;

use Database\Factories\PromotionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Promotion extends Model
{
    /** @use HasFactory<PromotionFactory> */
    use HasFactory;

    protected $guarded = [];

    public function usages(): HasMany
    {
        return $this->hasMany(PromotionUsage::class);
    }

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'min_order_amount' => 'decimal:2',
            'max_discount_amount' => 'decimal:2',
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'active' => 'boolean',
            'first_order_only' => 'boolean',
            'free_shipping' => 'boolean',
        ];
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'promotion_products');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'promotion_categories');
    }

    public function brands(): BelongsToMany
    {
        return $this->belongsToMany(Brand::class, 'promotion_brands');
    }
}
