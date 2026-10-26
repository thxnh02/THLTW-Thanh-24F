<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicProductFiltersTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_products_keep_twelve_per_page_and_stable_newest_first_order(): void
    {
        $category = $this->category('pagination');
        foreach (range(1, 14) as $number) {
            $this->product("product-{$number}", $category);
        }

        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonCount(12, 'data')
            ->assertJsonPath('data.0.slug', 'product-14')
            ->assertJsonPath('meta.total', 14)
            ->assertJsonPath('meta.per_page', 12)
            ->assertJsonPath('meta.last_page', 2);
        $this->getJson('/api/products?page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.slug', 'product-2');
    }

    public function test_category_brand_and_price_filters_combine_with_and(): void
    {
        $category = $this->category('selected');
        $otherCategory = $this->category('other');
        $brand = $this->brand('selected');
        $otherBrand = $this->brand('other');
        $this->product('match', $category, $brand, 2000, 1500);
        $this->product('wrong-category', $otherCategory, $brand, 2000, 1500);
        $this->product('wrong-brand', $category, $otherBrand, 2000, 1500);
        $this->product('wrong-price', $category, $brand, 2500);

        $this->getJson("/api/products?category_id={$category->id}")
            ->assertOk()->assertJsonPath('meta.total', 3)->assertJsonMissing(['slug' => 'wrong-category']);
        $this->getJson("/api/products?brand_id={$brand->id}")
            ->assertOk()->assertJsonPath('meta.total', 3)->assertJsonMissing(['slug' => 'wrong-brand']);
        $this->getJson("/api/products?category_id={$category->id}&brand_id={$brand->id}&min_price=1400&max_price=1600")
            ->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.slug', 'match');
    }

    public function test_price_bounds_use_sale_only_when_it_is_below_regular_price_and_accept_zero(): void
    {
        $category = $this->category('prices');
        $this->product('free', $category, null, 0);
        $this->product('sale', $category, null, 4000, 1500);
        $this->product('regular', $category, null, 5000);
        $this->product('invalid-sale', $category, null, 5000, 6000);

        $this->getJson('/api/products?min_price=1400&max_price=1600')
            ->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.slug', 'sale');
        $this->getJson('/api/products?min_price=0&max_price=0')
            ->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.slug', 'free');
        $this->getJson('/api/products?min_price=5000&max_price=5000')
            ->assertOk()->assertJsonPath('meta.total', 2)->assertJsonMissing(['slug' => 'sale']);
    }

    public function test_pagination_links_preserve_all_applied_filters(): void
    {
        $category = $this->category('linked');
        $brand = $this->brand('linked');
        foreach (range(1, 13) as $number) {
            $this->product("linked-{$number}", $category, $brand, 2000, 1500);
        }
        $query = "category_id={$category->id}&brand_id={$brand->id}&min_price=1000&max_price=1600";

        $first = $this->getJson("/api/products?{$query}")->assertOk()->assertJsonPath('meta.total', 13);
        $next = $first->json('links.next');
        foreach (['category_id=', 'brand_id=', 'min_price=1000', 'max_price=1600', 'page=2'] as $part) {
            $this->assertStringContainsString($part, $next);
        }
        $this->getJson("/api/products?{$query}&page=2")
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('meta.current_page', 2);
    }

    public function test_filters_preserve_visibility_rules_and_exclude_soft_deleted_products(): void
    {
        $category = $this->category('visible');
        $hiddenCategory = $this->category('hidden', false);
        $brand = $this->brand('visible');
        $hiddenBrand = $this->brand('hidden', false);
        $this->product('visible', $category, $brand);
        $this->product('hidden-category', $hiddenCategory, $brand);
        $this->product('hidden-brand', $category, $hiddenBrand);
        $this->product('inactive', $category, $brand, 1000, null, false);
        $this->product('trashed', $category, $brand)->delete();

        $this->getJson("/api/products?brand_id={$brand->id}")
            ->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.slug', 'visible');
    }

    public function test_invalid_filter_values_return_json_validation_errors(): void
    {
        foreach ([
            ['/api/products?min_price=-1', 'min_price'],
            ['/api/products?max_price=abc', 'max_price'],
            ['/api/products?min_price=200&max_price=100', 'max_price'],
            ['/api/products?category_id=0', 'category_id'],
            ['/api/products?brand_id=bad', 'brand_id'],
            ['/api/products?page=0', 'page'],
        ] as [$url, $field]) {
            $this->getJson($url)->assertUnprocessable()->assertJsonValidationErrors($field);
        }
    }

    public function test_no_matches_return_an_empty_successful_page(): void
    {
        $category = $this->category('empty');
        $this->product('cheap', $category, null, 1000);

        $this->getJson("/api/products?category_id={$category->id}&min_price=2000")
            ->assertOk()->assertJsonCount(0, 'data')->assertJsonPath('meta.total', 0)->assertJsonPath('meta.per_page', 12);
    }

    private function category(string $slug, bool $status = true): Category
    {
        return Category::create(['name' => ucfirst($slug), 'slug' => "filter-category-{$slug}", 'status' => $status]);
    }

    private function brand(string $slug, bool $status = true): Brand
    {
        return Brand::create(['name' => ucfirst($slug), 'slug' => "filter-brand-{$slug}", 'status' => $status]);
    }

    private function product(string $slug, Category $category, ?Brand $brand = null, int $price = 1000, ?int $salePrice = null, bool $status = true): Product
    {
        return Product::create([
            'category_id' => $category->id,
            'brand_id' => $brand?->id,
            'name' => ucfirst($slug),
            'slug' => $slug,
            'price' => $price,
            'sale_price' => $salePrice,
            'status' => $status,
        ]);
    }
}
