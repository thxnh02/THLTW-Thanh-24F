<?php

namespace App\Models;

use App\Support\OrderStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = ['user_id', 'status'];

    protected static function booted(): void
    {
        static::created(fn (Order $order) => $order->statusHistory()->create(['from_status' => null, 'to_status' => $order->status ?? 'pending', 'created_at' => now()]));
        static::updated(function (Order $order): void {
            if ($order->wasChanged('status')) {
                $order->statusHistory()->create(['from_status' => $order->getOriginal('status'), 'to_status' => $order->status, 'created_at' => now()]);
            }
        });
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class)->orderBy('id');
    }

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

    public function notifications(): HasMany
    {
        return $this->hasMany(CustomerNotification::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function allowedNextStatuses(): array
    {
        $statuses = OrderStatus::next($this->status);
        if ($this->payment_method === 'cod' && in_array($this->payment_status, ['pending', 'demo_paid'], true)
            && in_array($this->status, ['pending', 'processing'], true) && ! $this->stock_restored_at) {
            $statuses[] = 'cancelled';
        }
        return $statuses;
    }
}
