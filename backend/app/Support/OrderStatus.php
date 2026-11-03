<?php

namespace App\Support;

class OrderStatus
{
    // Fulfillment status is independent from payment_status; a customer may cancel a pending demo COD order.
    private const NEXT = [
        'pending' => ['processing'],
        'processing' => ['delivered'],
        'delivered' => [],
        'cancelled' => [],
    ];

    public static function values(): array
    {
        return array_keys(self::NEXT);
    }

    public static function next(string $current): array
    {
        return self::NEXT[$current] ?? [];
    }
}
