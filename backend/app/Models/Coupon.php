<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = ['code', 'type', 'value', 'minimum_vnd', 'usage_limit', 'per_customer_limit', 'scope', 'starts_at', 'ends_at', 'active'];

    public function products(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'coupon_products');
    }

    protected function casts(): array
    {
        return ['active' => 'boolean', 'starts_at' => 'datetime', 'ends_at' => 'datetime'];
    }
}
