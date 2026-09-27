<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Post;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ArchitectureCleanupTest extends TestCase
{
    use RefreshDatabase;

    public function test_resource_pagination_keeps_metadata_and_item_shape(): void
    {
        $this->seed();
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson('/api/v1/admin/categories?per_page=2&page=2')
            ->assertOk()
            ->assertJsonPath('data.current_page', 2)
            ->assertJsonPath('data.per_page', 2)
            ->assertJsonStructure(['data' => ['data' => [['id', 'name', 'slug']]]]);

        $this->getJson('/api/v1/admin/products?per_page=5&page=2')
            ->assertOk()
            ->assertJsonPath('data.current_page', 2)
            ->assertJsonStructure(['data' => ['data' => [['id', 'name', 'default_variant']]]]);

        $this->getJson('/api/v1/admin/users?per_page=1&page=2')
            ->assertOk()
            ->assertJsonPath('data.current_page', 2)
            ->assertJsonMissingPath('data.data.0.password');

        $this->getJson('/api/v1/products?per_page=6&page=2')
            ->assertOk()
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonStructure(['data' => [['id', 'primary_image', 'default_variant']]])
            ->assertJsonMissingPath('data.data');

        $this->getJson('/api/v1/posts?per_page=2&page=2')
            ->assertOk()
            ->assertJsonPath('data.current_page', 2)
            ->assertJsonStructure(['data' => ['data' => [['id', 'title', 'category']]]]);

        $this->getJson('/api/v1/homepage')
            ->assertOk()
            ->assertJsonStructure(['data' => ['banners', 'categories', 'new_products', 'best_selling_products', 'featured_products', 'latest_posts']]);

        $this->getJson('/api/v1/categories')->assertOk()->assertJsonPath('data.0.slug', 'dien-thoai');
        $this->getJson('/api/v1/brands')->assertOk()->assertJsonPath('data.0.slug', 'apple');

        $product = Product::query()->where('status', 'active')->firstOrFail();
        $this->getJson('/api/v1/products/'.$product->slug)
            ->assertOk()
            ->assertJsonPath('data.primary_image', '/product-placeholder.svg')
            ->assertJsonStructure(['data' => ['variants', 'images', 'reviews', 'related_products']]);

        $post = Post::query()->where('status', 'published')->firstOrFail();
        $this->getJson('/api/v1/posts/'.$post->slug)->assertOk()->assertJsonPath('data.category.slug', 'tin-cong-nghe');
        $this->getJson('/api/v1/pages/gioi-thieu')->assertOk()->assertJsonPath('data.slug', 'gioi-thieu');
    }

    public function test_product_update_preserves_images_and_guarantees_one_default_variant(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $category = Category::create(['name' => 'Cleanup Category', 'slug' => 'cleanup-category', 'status' => 'active']);
        $brand = Brand::create(['name' => 'Cleanup Brand', 'slug' => 'cleanup-brand', 'status' => 'active']);

        $productId = $this->postJson('/api/v1/admin/products', [
            'name' => 'Cleanup Product',
            'slug' => 'cleanup-product',
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'status' => 'active',
            'variants' => [
                ['sku' => 'CLEAN-1', 'name' => 'One', 'price' => 100, 'stock_quantity' => 2],
                ['sku' => 'CLEAN-2', 'name' => 'Two', 'price' => 120, 'stock_quantity' => 2],
            ],
            'images' => [
                ['path' => '/one.jpg', 'alt_text' => 'One', 'is_primary' => true, 'sort_order' => 1],
                ['path' => '/two.jpg', 'alt_text' => 'Two', 'is_primary' => false, 'sort_order' => 2],
            ],
        ])->assertCreated()->json('data.id');

        $variants = ProductVariant::query()->where('product_id', $productId)->orderBy('id')->get();
        $images = ProductImage::query()->where('product_id', $productId)->orderBy('id')->get();
        $this->assertSame(1, $variants->where('is_default', true)->count());

        $this->patchJson('/api/v1/admin/products/'.$productId, [
            'name' => 'Cleanup Product',
            'slug' => 'cleanup-product',
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'status' => 'active',
            'variants' => [
                [...$this->variantPayload($variants[0]), 'is_default' => true],
                [...$this->variantPayload($variants[1]), 'is_default' => true],
            ],
            'images' => [
                ['id' => $images[0]->id, 'path' => '/one-updated.jpg', 'alt_text' => 'Updated', 'is_primary' => true, 'sort_order' => 1],
            ],
        ])->assertOk();

        $this->assertSame(1, ProductVariant::query()->where('product_id', $productId)->where('is_default', true)->count());
        $this->assertDatabaseHas('product_images', ['id' => $images[0]->id, 'path' => '/one-updated.jpg']);
        $this->assertDatabaseHas('product_images', ['id' => $images[1]->id, 'path' => '/two.jpg']);

        $otherProduct = Product::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'name' => 'Other Product',
            'slug' => 'other-product',
            'status' => 'active',
        ]);
        $otherImage = ProductImage::create(['product_id' => $otherProduct->id, 'path' => '/other.jpg', 'is_primary' => true]);

        $this->patchJson('/api/v1/admin/products/'.$productId, [
            'name' => 'Cleanup Product',
            'slug' => 'cleanup-product',
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'status' => 'active',
            'variants' => array_map(fn (ProductVariant $variant): array => $this->variantPayload($variant), $variants->all()),
            'deleted_image_ids' => [$otherImage->id],
        ])->assertUnprocessable();

        $this->assertDatabaseHas('product_images', ['id' => $otherImage->id]);

        $this->patchJson('/api/v1/admin/products/'.$productId, [
            'name' => 'Cleanup Product',
            'slug' => 'cleanup-product',
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'status' => 'active',
            'variants' => array_map(fn (ProductVariant $variant): array => $this->variantPayload($variant), $variants->all()),
            'deleted_image_ids' => [$images[0]->id],
        ])->assertOk();

        $this->assertDatabaseMissing('product_images', ['id' => $images[0]->id]);
        $this->assertDatabaseHas('product_images', ['id' => $images[1]->id, 'is_primary' => true]);

        $this->patchJson('/api/v1/admin/products/'.$productId, [
            'name' => 'Cleanup Product',
            'slug' => 'cleanup-product',
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'status' => 'active',
            'deleted_variant_ids' => [$variants[0]->id],
            'variants' => [$this->variantPayload($variants[1])],
        ])->assertOk();

        $this->assertDatabaseMissing('product_variants', ['id' => $variants[0]->id]);
        $this->assertSame(1, ProductVariant::query()->where('product_id', $productId)->where('is_default', true)->count());
    }

    /** @return array<string, mixed> */
    private function variantPayload(ProductVariant $variant): array
    {
        return [
            'id' => $variant->id,
            'sku' => $variant->sku,
            'name' => $variant->name,
            'price' => $variant->price,
            'stock_quantity' => $variant->stock_quantity,
            'active' => true,
        ];
    }
}
