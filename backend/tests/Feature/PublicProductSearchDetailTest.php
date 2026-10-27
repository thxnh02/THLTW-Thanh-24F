<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicProductSearchDetailTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_sort_filters_and_bounded_pagination_compose(): void
    {
        $root = $this->category('search-root');
        $phones = $this->category('search-phones', $root);
        $laptops = $this->category('search-laptops', $root);
        $apple = $this->brand('search-apple');
        $samsung = $this->brand('search-samsung');
        $this->product('iphone-15-pro', 'iPhone 15 Pro', $phones, $apple, 2000, 1500);
        $this->product('iphone-14', 'iPhone 14', $phones, $apple, 1800, 1300);
        $this->product('galaxy-iphone-case', 'Case', $phones, $samsung, 500);
        $this->product('macbook-iphone-bag', 'Bag', $laptops, $apple, 900);

        $this->getJson("/api/products?q=iphone&category_id={$root->id}&brand_id={$apple->id}&min_price=1200&max_price=1600&sort=price_asc&per_page=1&page=1")
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.per_page', 1)
            ->assertJsonPath('data.0.slug', 'iphone-14')
            ->assertJsonPath('links.next', fn ($next) => str_contains($next, 'q=iphone') && str_contains($next, 'sort=price_asc'));
    }

    public function test_search_is_literal_and_invalid_search_sort_and_paging_return_422(): void
    {
        $category = $this->category('literal-search');
        $this->product('literal-100-phone', 'Phone 100%', $category);
        $this->product('literal-100x-phone', 'Phone 100x', $category);

        $this->getJson('/api/products?q=100%25')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.slug', 'literal-100-phone');

        foreach ([
            ['/api/products?q='.str_repeat('x', 101), 'q'],
            ['/api/products?sort=random', 'sort'],
            ['/api/products?sort=relevant', 'sort'],
            ['/api/products?page=0', 'page'],
            ['/api/products?per_page=13', 'per_page'],
            ['/api/products?sale=maybe', 'sale'],
        ] as [$url, $field]) {
            $this->getJson($url)->assertUnprocessable()->assertJsonValidationErrors($field);
        }
    }

    public function test_suggestions_return_only_visible_relevant_products_and_at_most_six(): void
    {
        $category = $this->category('suggestions');
        foreach (range(1, 8) as $number) {
            $this->product("iphone-{$number}", "iPhone {$number}", $category);
        }
        $hiddenCategory = $this->category('suggestions-hidden', null, false);
        $this->product('iphone-hidden', 'iPhone Hidden', $hiddenCategory);
        $this->product('inactive-iphone', 'iPhone Inactive', $category, null, 1000, null, false);
        $this->product('trashed-iphone', 'iPhone Trashed', $category)->delete();

        $this->getJson('/api/products/suggestions?q=iphone')
            ->assertOk()
            ->assertJsonCount(6, 'data')
            ->assertJsonPath('data.0.slug', 'iphone-8')
            ->assertJsonMissing(['slug' => 'iphone-hidden'])
            ->assertJsonMissing(['slug' => 'inactive-iphone'])
            ->assertJsonMissing(['slug' => 'trashed-iphone']);
    }

    public function test_detail_is_public_only_for_visible_product_and_loads_real_relations(): void
    {
        $category = $this->category('detail');
        $brand = $this->brand('detail');
        $product = $this->product('detail-product', 'Detail Product', $category, $brand, 3000, 2500);

        $this->getJson('/api/products/detail-product')
            ->assertOk()
            ->assertJsonPath('data.slug', 'detail-product')
            ->assertJsonPath('data.category.id', $category->id)
            ->assertJsonPath('data.brand.id', $brand->id)
            ->assertJsonPath('data.price', '3000.00')
            ->assertJsonPath('data.sale_price', '2500.00');

        $this->getJson('/api/products/not-a-product')->assertNotFound();
        $product->update(['status' => false]);
        $this->getJson('/api/products/detail-product')->assertNotFound();
        $product->update(['status' => true]);
        $category->delete();
        $this->getJson('/api/products/detail-product')->assertNotFound();
    }

    public function test_related_products_exclude_current_product_and_hidden_records_and_cap_limit(): void
    {
        $category = $this->category('related');
        $brand = $this->brand('related');
        $otherBrand = $this->brand('related-other');
        $current = $this->product('related-current', 'Current', $category, $brand);
        $sameCategoryAndBrand = $this->product('related-best', 'Closest', $category, $brand);
        $sameCategory = $this->product('related-category', 'Same Category', $category, $otherBrand);
        $sameBrand = $this->product('related-brand', 'Same Brand', $this->category('related-brand-category'), $brand);
        $this->product('unrelated', 'Unrelated', $this->category('unrelated'), $otherBrand);
        $inactive = $this->product('related-inactive', 'Inactive', $category, $brand, 1000, null, false);

        $this->getJson('/api/products/related-current/related?limit=99')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.slug', $sameCategoryAndBrand->slug)
            ->assertJsonFragment(['slug' => $sameCategory->slug])
            ->assertJsonFragment(['slug' => $sameBrand->slug])
            ->assertJsonMissing(['slug' => $current->slug])
            ->assertJsonMissing(['slug' => $inactive->slug]);
    }

    public function test_sale_and_featured_queries_use_real_flags_and_valid_sale_prices(): void
    {
        $category = $this->category('curated');
        $featured = $this->product('featured-sale', 'Featured sale', $category, null, 3000, 2000);
        $featured->update(['is_featured' => true]);
        $this->product('invalid-sale', 'Invalid Sale', $category, null, 3000, 4000);
        $this->product('regular', 'Regular', $category);

        $this->getJson('/api/products?sale=1&sort=price_asc&per_page=8')
            ->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.slug', 'featured-sale');
        $this->getJson('/api/products?sale=0')
            ->assertOk()->assertJsonPath('meta.total', 2)
            ->assertJsonMissing(['slug' => 'featured-sale']);
        $this->getJson('/api/products?featured=1')
            ->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.is_featured', true);
    }

    public function test_admin_can_create_a_curated_featured_product(): void
    {
        $category = $this->category('admin-featured');

        $this->postJson('/api/admin/products', [
            'category_id' => $category->id,
            'name' => 'Curated Product',
            'slug' => 'curated-product',
            'price' => 2500,
            'status' => true,
            'is_featured' => true,
        ])->assertCreated()->assertJsonPath('data.is_featured', true);

        $this->assertDatabaseHas('products', ['slug' => 'curated-product', 'is_featured' => true]);
    }

    private function category(string $slug, ?Category $parent = null, bool $status = true): Category
    {
        return Category::create([
            'parent_id' => $parent?->id,
            'name' => ucfirst($slug),
            'slug' => "search-category-{$slug}",
            'status' => $status,
        ]);
    }

    private function brand(string $slug): Brand
    {
        return Brand::create(['name' => ucfirst($slug), 'slug' => "search-brand-{$slug}", 'status' => true]);
    }

    private function product(
        string $slug,
        string $name,
        Category $category,
        ?Brand $brand = null,
        int $price = 1000,
        ?int $salePrice = null,
        bool $status = true,
    ): Product {
        return Product::create([
            'category_id' => $category->id,
            'brand_id' => $brand?->id,
            'name' => $name,
            'slug' => $slug,
            'price' => $price,
            'sale_price' => $salePrice,
            'status' => $status,
        ]);
    }
}
