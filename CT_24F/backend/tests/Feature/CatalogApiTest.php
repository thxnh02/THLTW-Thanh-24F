<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_category_and_brand_endpoints_return_only_active_data(): void
    {
        $root = $this->category('root', true);
        $child = $this->category('child', true, $root->id);
        $this->category('hidden', false);
        $brand = $this->brand('brand', true);
        $this->brand('hidden-brand', false);

        $this->getJson('/api/categories')->assertOk()->assertJsonPath('data.0.slug', 'root')->assertJsonCount(1, 'data.0.children');
        $this->getJson('/api/categories/root')->assertOk()->assertJsonPath('data.slug', 'root')->assertJsonPath('data.children.0.id', $child->id);
        $this->getJson('/api/categories/missing')->assertNotFound();
        $this->getJson('/api/brands')->assertOk()->assertJsonPath('data.0.id', $brand->id)->assertJsonCount(1, 'data');
    }

    public function test_public_products_are_paginated_twelve_per_page(): void
    {
        $category = $this->category('root');
        $brand = $this->brand('brand');
        foreach (range(1, 14) as $number) {
            Product::create(['category_id' => $category->id, 'brand_id' => $brand->id, 'name' => "Product {$number}", 'slug' => "product-{$number}", 'price' => 1000, 'status' => true]);
        }

        $this->getJson('/api/products')->assertOk()->assertJsonCount(12, 'data')->assertJsonPath('meta.per_page', 12)->assertJsonStructure(['links', 'meta']);
        $this->getJson('/api/products?page=2')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_demo_seeder_is_idempotent(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseCount('categories', 5);
        $this->assertDatabaseCount('brands', 3);
        $this->assertDatabaseCount('products', 14);
    }

    public function test_admin_category_crud_pagination_validation_and_delete_rules(): void
    {
        foreach (range(1, 11) as $number) {
            $this->category("category-{$number}");
        }
        $this->getJson('/api/admin/categories')->assertOk()->assertJsonCount(10, 'data')->assertJsonPath('meta.per_page', 10);
        $this->postJson('/api/admin/categories', ['name' => 'No slug'])->assertUnprocessable()->assertJsonValidationErrors('slug');

        $created = $this->postJson('/api/admin/categories', ['name' => 'New', 'slug' => 'new', 'sort_order' => 1, 'status' => true])->assertCreated();
        $id = $created->json('data.id');
        $this->getJson("/api/admin/categories/{$id}")->assertOk()->assertJsonPath('data.slug', 'new');
        $this->getJson('/api/admin/categories/9999')->assertNotFound();
        $this->putJson("/api/admin/categories/{$id}", ['name' => 'Updated', 'slug' => 'updated', 'sort_order' => 2, 'status' => false])->assertOk()->assertJsonPath('data.slug', 'updated');
        $this->putJson("/api/admin/categories/{$id}", ['name' => 'Updated', 'slug' => 'category-1', 'status' => true])->assertUnprocessable()->assertJsonValidationErrors('slug');
        $this->deleteJson("/api/admin/categories/{$id}")->assertOk();

        $parent = $this->category('parent');
        $this->category('child', true, $parent->id);
        $this->deleteJson("/api/admin/categories/{$parent->id}")->assertStatus(409);
        $inUse = $this->category('in-use');
        Product::create(['category_id' => $inUse->id, 'name' => 'Related', 'slug' => 'related', 'price' => 1000, 'status' => true]);
        $this->deleteJson("/api/admin/categories/{$inUse->id}")->assertStatus(409);
    }

    public function test_admin_brand_crud_pagination_validation_and_delete_rules(): void
    {
        foreach (range(1, 11) as $number) {
            $this->brand("brand-{$number}");
        }
        $this->getJson('/api/admin/brands')->assertOk()->assertJsonCount(10, 'data')->assertJsonPath('meta.per_page', 10);
        $this->postJson('/api/admin/brands', ['name' => 'No slug'])->assertUnprocessable()->assertJsonValidationErrors('slug');

        $created = $this->postJson('/api/admin/brands', ['name' => 'New', 'slug' => 'new-brand', 'sort_order' => 1, 'status' => true])->assertCreated();
        $id = $created->json('data.id');
        $this->getJson("/api/admin/brands/{$id}")->assertOk()->assertJsonPath('data.slug', 'new-brand');
        $this->getJson('/api/admin/brands/9999')->assertNotFound();
        $this->putJson("/api/admin/brands/{$id}", ['name' => 'Updated', 'slug' => 'updated-brand', 'sort_order' => 2, 'status' => false])->assertOk()->assertJsonPath('data.slug', 'updated-brand');
        $this->putJson("/api/admin/brands/{$id}", ['name' => 'Updated', 'slug' => 'brand-1', 'status' => true])->assertUnprocessable()->assertJsonValidationErrors('slug');
        $this->deleteJson("/api/admin/brands/{$id}")->assertOk();

        $inUse = $this->brand('in-use');
        $category = $this->category('root');
        Product::create(['category_id' => $category->id, 'brand_id' => $inUse->id, 'name' => 'Related', 'slug' => 'related', 'price' => 1000, 'status' => true]);
        $this->deleteJson("/api/admin/brands/{$inUse->id}")->assertStatus(409);
    }

    private function category(string $slug, bool $status = true, ?int $parentId = null): Category
    {
        return Category::create(['parent_id' => $parentId, 'name' => ucfirst($slug), 'slug' => $slug, 'status' => $status]);
    }

    private function brand(string $slug, bool $status = true): Brand
    {
        return Brand::create(['name' => ucfirst($slug), 'slug' => $slug, 'status' => $status]);
    }
}
