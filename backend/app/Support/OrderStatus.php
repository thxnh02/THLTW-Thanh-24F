<?php

namespace App\Support;

class OrderStatus
{
    // Fulfillment and payment have independent states.
    private const NEXT = [
        'pending' => ['processing'],
        'processing' => ['shipping', 'delivered'],
        'shipping' => ['delivered'],
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
