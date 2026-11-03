<?php

namespace App\Models;

use App\Support\OrderStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = ['user_id', 'status'];

    protected function casts(): array
    {
        return ['shipping_snapshot' => 'array', 'paid_at' => 'datetime', 'stock_restored_at' => 'datetime', 'payment_review_required' => 'boolean'];
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function paymentAttempts(): HasMany
    {
        return $this->hasMany(PaymentAttempt::class);
    }

    public function paymentEvents(): HasMany
    {
        return $this->hasMany(PaymentReconciliationEvent::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function allowedNextStatuses(): array
    {
        return OrderStatus::next($this->status);
    }
}
