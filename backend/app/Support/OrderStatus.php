<?php

namespace App\Support;

class OrderStatus
{
    // Chưa có luồng thanh toán/vận chuyển; chỉ dùng ba trạng thái tối thiểu cho bài quản trị.
    private const NEXT = [
        'pending' => ['processing'],
        'processing' => ['delivered'],
        'delivered' => [],
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
