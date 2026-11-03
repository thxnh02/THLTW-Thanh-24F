<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
    protected $fillable = ['user_id', 'product_id', 'quantity', 'unit_price_at_add_vnd'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
