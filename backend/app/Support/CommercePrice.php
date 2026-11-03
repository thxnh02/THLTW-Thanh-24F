<?php

namespace App\Support;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use InvalidArgumentException;

class CommercePrice
{
    public static function visible(): Builder
    {
        return Product::query()->active()
            ->whereHas('category', fn (Builder $q) => $q->where('status', true))
            ->where(fn (Builder $q) => $q->whereNull('brand_id')->orWhereHas('brand', fn (Builder $b) => $b->where('status', true)));
    }

    // Prices are decimal(12,2). Half a dong rounds up, without binary floats.
    public static function vnd(string $value): int
    {
        if (! preg_match('/^(\d{1,10})(?:\.(\d{1,2}))?$/', $value, $parts)) {
            throw new InvalidArgumentException('Giá sản phẩm không hợp lệ.');
        }
        $fraction = $parts[2] ?? '00';

        return (int) $parts[1] + ((int) str_pad($fraction, 2, '0') >= 50 ? 1 : 0);
    }

    public static function productVnd(Product $product): int
    {
        $price = (string) $product->price;
        $sale = $product->sale_price === null ? null : (string) $product->sale_price;

        return self::vnd($sale !== null && self::cents($sale) < self::cents($price) ? $sale : $price);
    }

    private static function cents(string $value): int
    {
        if (! preg_match('/^(\d{1,10})\.(\d{2})$/', $value, $parts)) {
            throw new InvalidArgumentException('Giá sản phẩm không hợp lệ.');
        }

        return (int) $parts[1] * 100 + (int) $parts[2];
    }
}
