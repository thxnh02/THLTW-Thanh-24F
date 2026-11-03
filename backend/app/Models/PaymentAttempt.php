<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentAttempt extends Model
{
    protected $guarded = [];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    protected function casts(): array
    {
        return ['processed_at' => 'datetime', 'pay_created_at' => 'datetime',
            'pay_expires_at' => 'datetime', 'last_checked_at' => 'datetime'];
    }
}
