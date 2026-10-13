<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShippingMethod extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'fee' => 'decimal:2',
            'free_shipping_threshold' => 'decimal:2',
            'estimated_days_min' => 'integer',
            'estimated_days_max' => 'integer',
            'active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function feeForSubtotal(float $subtotal): float
    {
        if ($this->free_shipping_threshold !== null && $subtotal >= (float) $this->free_shipping_threshold) {
            return 0.0;
        }

        return (float) $this->fee;
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
