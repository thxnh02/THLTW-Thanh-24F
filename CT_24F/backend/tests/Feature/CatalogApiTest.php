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

    public function test_soft_deleted_category_brand_and_product_are_hidden_from_default_queries(): void
    {
        $category = $this->category('soft-delete-category');
        $brand = $this->brand('soft-delete-brand');
        $product = Product::create(['category_id' => $category->id, 'brand_id' => $brand->id, 'name' => 'Soft Delete Product', 'slug' => 'soft-delete-product', 'price' => 1000, 'status' => true]);

        $product->delete();
        $category->delete();
        $brand->delete();

        $this->assertNull(Category::find($category->id));
        $this->assertNull(Brand::find($brand->id));
        $this->assertNull(Product::find($product->id));
        $this->assertNotNull(Category::onlyTrashed()->find($category->id));
        $this->assertNotNull(Brand::onlyTrashed()->find($brand->id));
        $this->assertNotNull(Product::onlyTrashed()->find($product->id));
    }

    public function test_admin_resources_include_deleted_at_without_changing_public_product_schema(): void
    {
        $category = $this->category('resource-category');
        $brand = $this->brand('resource-brand');
        $product = Product::create(['category_id' => $category->id, 'brand_id' => $brand->id, 'name' => 'Resource Product', 'slug' => 'resource-product', 'price' => 1000, 'status' => true]);

        $this->getJson("/api/admin/categories/{$category->id}")->assertOk()->assertJsonPath('data.deleted_at', null);
        $this->getJson("/api/admin/brands/{$brand->id}")->assertOk()->assertJsonPath('data.deleted_at', null);
        $this->getJson('/api/products')->assertOk()->assertJsonMissingPath('data.0.deleted_at')->assertJsonMissingPath('data.0.status');
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

    public function test_admin_category_crud_and_options_exclude_trashed_parent_choices(): void
    {
        foreach (range(1, 12) as $number) {
            $this->category("option-category-{$number}", $number !== 1);
        }
        $trashed = Category::where('slug', 'option-category-12')->firstOrFail();
        $trashed->delete();

        $this->getJson('/api/admin/categories')->assertOk()->assertJsonCount(10, 'data')->assertJsonFragment(['id' => 1, 'status' => false]);
        $this->getJson('/api/admin/categories/options')->assertOk()->assertJsonCount(11, 'data')->assertJsonMissing(['id' => $trashed->id]);
        $this->postJson('/api/admin/categories', ['parent_id' => $trashed->id, 'name' => 'Invalid Child', 'slug' => 'invalid-child', 'status' => true])->assertUnprocessable()->assertJsonValidationErrors('parent_id');
        $this->postJson('/api/admin/categories', ['name' => 'Reserved Slug', 'slug' => $trashed->slug, 'status' => true])->assertUnprocessable()->assertJsonValidationErrors('slug');
    }

    public function test_category_soft_delete_checks_active_dependencies(): void
    {
        $parent = $this->category('blocked-parent');
        $this->category('blocked-child', false, $parent->id);
        $this->deleteJson("/api/admin/categories/{$parent->id}")->assertStatus(409);

        $category = $this->category('hidden-product-category');
        Product::create(['category_id' => $category->id, 'name' => 'Hidden Product', 'slug' => 'hidden-product', 'price' => 1000, 'status' => false]);
        $this->deleteJson("/api/admin/categories/{$category->id}")->assertStatus(409);

        $trashedProductCategory = $this->category('trashed-product-category');
        $product = Product::create(['category_id' => $trashedProductCategory->id, 'name' => 'Trashed Product', 'slug' => 'trashed-product', 'price' => 1000, 'status' => true]);
        $product->delete();
        $this->deleteJson("/api/admin/categories/{$trashedProductCategory->id}")->assertOk();
    }

    public function test_category_trash_restore_and_force_delete_lifecycle(): void
    {
        $category = $this->category('lifecycle-category');
        $this->deleteJson("/api/admin/categories/{$category->id}")->assertOk();
        $this->getJson("/api/admin/categories/{$category->id}")->assertNotFound();
        $this->getJson('/api/admin/categories/trash')->assertOk()->assertJsonFragment(['id' => $category->id]);
        $this->getJson("/api/admin/categories/trash/{$category->id}")->assertOk()->assertJsonPath('data.deleted_at', fn ($value) => $value !== null);
        $this->postJson("/api/admin/categories/{$category->id}/restore")->assertOk();
        $this->assertNotNull(Category::find($category->id));

        $withHistory = $this->category('force-blocked-category');
        $product = Product::create(['category_id' => $withHistory->id, 'name' => 'Historic Product', 'slug' => 'historic-product', 'price' => 1000, 'status' => true]);
        $product->delete();
        $this->deleteJson("/api/admin/categories/{$withHistory->id}")->assertOk();
        $this->deleteJson("/api/admin/categories/{$withHistory->id}/force")->assertStatus(409);

        $withChildHistory = $this->category('force-child-parent');
        $child = $this->category('force-child-history', true, $withChildHistory->id);
        $child->delete();
        $this->deleteJson("/api/admin/categories/{$withChildHistory->id}")->assertOk();
        $this->deleteJson("/api/admin/categories/{$withChildHistory->id}/force")->assertStatus(409);

        $permanent = $this->category('permanent-category');
        $this->deleteJson("/api/admin/categories/{$permanent->id}")->assertOk();
        $this->deleteJson("/api/admin/categories/{$permanent->id}/force")->assertOk();
        $this->getJson("/api/admin/categories/trash/{$permanent->id}")->assertNotFound();
    }

    public function test_category_restore_and_update_reject_invalid_parent_graph(): void
    {
        $root = $this->category('cycle-root');
        $child = $this->category('cycle-child', true, $root->id);
        $leaf = $this->category('cycle-leaf', true, $child->id);

        $this->putJson("/api/admin/categories/{$root->id}", ['parent_id' => $leaf->id, 'name' => $root->name, 'slug' => $root->slug, 'status' => true])->assertUnprocessable()->assertJsonValidationErrors('parent_id');
        $this->putJson("/api/admin/categories/{$child->id}", ['parent_id' => $child->id, 'name' => $child->name, 'slug' => $child->slug, 'status' => true])->assertUnprocessable()->assertJsonValidationErrors('parent_id');

        $child->delete();
        $root->delete();
        $this->postJson("/api/admin/categories/{$child->id}/restore")->assertStatus(409);
        $this->postJson("/api/admin/categories/{$root->id}/restore")->assertOk();
        $this->postJson("/api/admin/categories/{$child->id}/restore")->assertOk();
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
