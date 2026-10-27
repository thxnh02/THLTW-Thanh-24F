<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/** Add starter homepage merchandising without changing existing prices or configured promotions. */
class HomepageShowcaseSeeder extends Seeder
{
    private const SALE_PRICES = [
        'iphone-14' => 14990000,
        'galaxy-a55' => 8490000,
    ];

    private const FEATURED_SLUGS = ['iphone-15', 'galaxy-s24', 'macbook-air-m3'];

    public function run(): void
    {
        DB::transaction(function (): void {
            foreach (self::SALE_PRICES as $slug => $salePrice) {
                $product = Product::query()
                    ->where('status', true)
                    ->where('slug', $slug)
                    ->first();

                if ($product !== null && $product->sale_price === null && $salePrice < (float) $product->price) {
                    $product->sale_price = $salePrice;
                    $product->save();
                }
            }

            Product::query()
                ->where('status', true)
                ->whereIn('slug', self::FEATURED_SLUGS)
                ->where('is_featured', false)
                ->update(['is_featured' => true]);
        });
    }
}
