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
        $this->getJson('/api/products')->assertOk()->assertJsonMissingPath('data.0.category_id')->assertJsonMissingPath('data.0.brand_id')->assertJsonMissingPath('data.0.deleted_at')->assertJsonMissingPath('data.0.status');
    }

    public function test_catalog_seeder_is_idempotent_and_preserves_edited_records(): void
    {
        $this->seed(DatabaseSeeder::class);
        Category::where('slug', 'dien-tu')->update(['name' => 'Tên danh mục đã chỉnh sửa']);
        Brand::where('slug', 'apple')->update(['name' => 'Tên thương hiệu đã chỉnh sửa']);
        Product::where('slug', 'iphone-15')->update(['name' => 'Tên sản phẩm đã chỉnh sửa', 'price' => 123456]);

        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseCount('categories', 5);
        $this->assertDatabaseCount('brands', 3);
        $this->assertDatabaseCount('products', 14);
        $this->assertDatabaseHas('categories', ['slug' => 'dien-tu', 'name' => 'Tên danh mục đã chỉnh sửa']);
        $this->assertDatabaseHas('brands', ['slug' => 'apple', 'name' => 'Tên thương hiệu đã chỉnh sửa']);
        $this->assertDatabaseHas('products', ['slug' => 'iphone-15', 'name' => 'Tên sản phẩm đã chỉnh sửa', 'price' => 123456]);
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
        $this->putJson("/api/admin/categories/{$id}", ['name' => 'Updated', 'slug' => 'category-1', 'status' => true])->assertOk()->assertJsonPath('data.slug', 'category-1-2');
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
        $this->postJson('/api/admin/categories', ['name' => 'Reserved Slug', 'slug' => $trashed->slug, 'status' => true])->assertCreated()->assertJsonPath('data.slug', 'option-category-12-2');
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
        $this->putJson("/api/admin/brands/{$id}", ['name' => 'Updated', 'slug' => 'brand-1', 'status' => true])->assertOk()->assertJsonPath('data.slug', 'brand-1-2');
        $this->deleteJson("/api/admin/brands/{$id}")->assertOk();

        $inUse = $this->brand('in-use');
        $category = $this->category('root');
        Product::create(['category_id' => $category->id, 'brand_id' => $inUse->id, 'name' => 'Related', 'slug' => 'related', 'price' => 1000, 'status' => true]);
        $this->deleteJson("/api/admin/brands/{$inUse->id}")->assertStatus(409);
    }

    public function test_admin_brand_crud_and_trash_lifecycle(): void
    {
        foreach (range(1, 12) as $number) {
            $this->brand("lifecycle-brand-{$number}", $number !== 1);
        }
        $trashed = Brand::where('slug', 'lifecycle-brand-12')->firstOrFail();
        $trashed->delete();

        $this->getJson('/api/admin/brands')->assertOk()->assertJsonCount(10, 'data')->assertJsonFragment(['id' => 1, 'status' => false]);
        $this->getJson('/api/admin/brands/options')->assertOk()->assertJsonCount(11, 'data')->assertJsonMissing(['id' => $trashed->id]);
        $this->postJson('/api/admin/brands', ['name' => 'Reserved Brand', 'slug' => $trashed->slug, 'status' => true])->assertCreated()->assertJsonPath('data.slug', 'lifecycle-brand-12-2');
        $this->postJson('/api/admin/brands/1/restore')->assertNotFound();

        $this->getJson('/api/admin/brands/1')->assertOk();
        $this->getJson('/api/admin/brands/12')->assertNotFound();
        $this->getJson('/api/admin/brands/trash')->assertOk()->assertJsonFragment(['id' => $trashed->id]);
        $this->getJson("/api/admin/brands/trash/{$trashed->id}")->assertOk()->assertJsonPath('data.deleted_at', fn ($value) => $value !== null);
        $this->postJson("/api/admin/brands/{$trashed->id}/restore")->assertOk();
        $this->assertNotNull(Brand::find($trashed->id));

        $permanent = $this->brand('permanent-brand');
        $this->deleteJson("/api/admin/brands/{$permanent->id}")->assertOk();
        $this->deleteJson("/api/admin/brands/{$permanent->id}/force")->assertOk();
        $this->getJson("/api/admin/brands/trash/{$permanent->id}")->assertNotFound();
    }

    public function test_brand_deletion_guards_include_trashed_products(): void
    {
        $category = $this->category('brand-guard-category');
        $hiddenBrand = $this->brand('brand-with-hidden-product');
        Product::create(['category_id' => $category->id, 'brand_id' => $hiddenBrand->id, 'name' => 'Hidden Brand Product', 'slug' => 'hidden-brand-product', 'price' => 1000, 'status' => false]);
        $this->deleteJson("/api/admin/brands/{$hiddenBrand->id}")->assertStatus(409);

        $historicBrand = $this->brand('brand-with-trashed-product');
        $product = Product::create(['category_id' => $category->id, 'brand_id' => $historicBrand->id, 'name' => 'Trashed Brand Product', 'slug' => 'trashed-brand-product', 'price' => 1000, 'status' => true]);
        $product->delete();
        $this->deleteJson("/api/admin/brands/{$historicBrand->id}")->assertOk();
        $this->deleteJson("/api/admin/brands/{$historicBrand->id}/force")->assertStatus(409);
    }

    public function test_admin_product_crud_validation_and_duplicate_slugs_get_unique_suffixes(): void
    {
        $category = $this->category('admin-product-category', false);
        $brand = $this->brand('admin-product-brand', false);
        $payload = ['category_id' => $category->id, 'brand_id' => $brand->id, 'name' => 'Admin Product', 'slug' => 'admin-product', 'price' => '1299.90', 'status' => false];
        $created = $this->postJson('/api/admin/products', $payload)->assertCreated()->assertJsonPath('data.status', false)->assertJsonPath('data.deleted_at', null)->assertJsonPath('data.category_id', $category->id)->assertJsonPath('data.brand_id', $brand->id)->assertJsonPath('data.category.id', $category->id)->assertJsonPath('data.brand.id', $brand->id);
        $id = $created->json('data.id');

        $this->getJson('/api/admin/products')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('meta.per_page', 10);
        $this->getJson("/api/admin/products/{$id}")->assertOk()->assertJsonPath('data.slug', 'admin-product');
        $this->putJson("/api/admin/products/{$id}", [...$payload, 'name' => 'Updated Admin Product'])->assertOk()->assertJsonPath('data.name', 'Updated Admin Product');
        $this->postJson('/api/admin/products', [...$payload, 'slug' => 'invalid-precision', 'price' => '100.999'])->assertUnprocessable()->assertJsonValidationErrors('price');
        $this->postJson('/api/admin/products', [...$payload, 'slug' => 'too-expensive', 'price' => '10000000000.00'])->assertUnprocessable()->assertJsonValidationErrors('price');
        $this->postJson('/api/admin/products', [...$payload, 'slug' => 'missing-category', 'category_id' => 9999])->assertUnprocessable()->assertJsonValidationErrors('category_id');

        $other = Product::create(['category_id' => $category->id, 'name' => 'Other Product', 'slug' => 'other-product', 'price' => 1000, 'status' => true]);
        $this->putJson("/api/admin/products/{$id}", [...$payload, 'slug' => $other->slug])->assertOk()->assertJsonPath('data.slug', 'other-product-2');

        $trashed = Product::create(['category_id' => $category->id, 'name' => 'Trashed Slug Product', 'slug' => 'reserved-product-slug', 'price' => 1000, 'status' => true]);
        $trashed->delete();
        $this->postJson('/api/admin/products', [...$payload, 'name' => 'Another Product', 'slug' => $trashed->slug])->assertCreated()->assertJsonPath('data.slug', 'reserved-product-slug-2');
    }

    public function test_distinct_names_can_share_a_requested_slug_and_editing_keeps_its_own_slug(): void
    {
        $categoryPayload = ['name' => 'Same Category', 'slug' => 'same-category', 'status' => true];
        $firstCategory = $this->postJson('/api/admin/categories', $categoryPayload)->assertCreated()->assertJsonPath('data.slug', 'same-category');
        $this->postJson('/api/admin/categories', [...$categoryPayload, 'name' => 'Second Category'])->assertCreated()->assertJsonPath('data.slug', 'same-category-2');
        $this->postJson('/api/admin/categories', [...$categoryPayload, 'name' => 'Third Category'])->assertCreated()->assertJsonPath('data.slug', 'same-category-3');
        $categoryId = $firstCategory->json('data.id');
        $this->putJson("/api/admin/categories/{$categoryId}", $categoryPayload)->assertOk()->assertJsonPath('data.slug', 'same-category');

        $brandPayload = ['name' => 'Same Brand', 'slug' => 'same-brand', 'status' => true];
        $firstBrand = $this->postJson('/api/admin/brands', $brandPayload)->assertCreated()->assertJsonPath('data.slug', 'same-brand');
        $this->postJson('/api/admin/brands', [...$brandPayload, 'name' => 'Second Brand'])->assertCreated()->assertJsonPath('data.slug', 'same-brand-2');
        $this->postJson('/api/admin/brands', [...$brandPayload, 'name' => 'Third Brand'])->assertCreated()->assertJsonPath('data.slug', 'same-brand-3');
        $this->putJson("/api/admin/brands/{$firstBrand->json('data.id')}", $brandPayload)->assertOk()->assertJsonPath('data.slug', 'same-brand');

        $productPayload = ['category_id' => $categoryId, 'name' => 'Same Product', 'slug' => 'same-product', 'price' => 1000, 'status' => true];
        $firstProduct = $this->postJson('/api/admin/products', $productPayload)->assertCreated()->assertJsonPath('data.slug', 'same-product');
        $this->postJson('/api/admin/products', [...$productPayload, 'name' => 'Second Product'])->assertCreated()->assertJsonPath('data.slug', 'same-product-2');
        $this->postJson('/api/admin/products', [...$productPayload, 'name' => 'Third Product'])->assertCreated()->assertJsonPath('data.slug', 'same-product-3');
        $this->putJson("/api/admin/products/{$firstProduct->json('data.id')}", $productPayload)->assertOk()->assertJsonPath('data.slug', 'same-product');
    }

    public function test_backend_normalizes_vietnamese_slug_and_keeps_suffix_inside_length_limit(): void
    {
        $this->postJson('/api/admin/categories', ['name' => 'Điện thoại', 'slug' => 'Điện thoại', 'status' => true])
            ->assertCreated()->assertJsonPath('data.slug', 'dien-thoai');

        $longSlug = str_repeat('a', 170);
        $this->postJson('/api/admin/categories', ['name' => 'Long name again', 'slug' => $longSlug, 'status' => true])
            ->assertCreated()->assertJsonPath('data.slug', $longSlug);
        $this->postJson('/api/admin/categories', ['name' => 'Long name', 'slug' => $longSlug, 'status' => true])
            ->assertCreated()->assertJsonPath('data.slug', str_repeat('a', 168).'-2');
    }

    public function test_catalog_names_are_unique_on_create_and_edit_including_trashed_rows(): void
    {
        $category = $this->category('camera');
        $otherCategory = $this->category('other-category');
        $this->postJson('/api/admin/categories', ['name' => ' camera ', 'slug' => 'new-category', 'status' => true])
            ->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->putJson("/api/admin/categories/{$otherCategory->id}", ['name' => 'CAMERA', 'slug' => 'other-category', 'status' => true])
            ->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->putJson("/api/admin/categories/{$category->id}", ['name' => ' Camera ', 'slug' => 'camera', 'status' => true])
            ->assertOk()->assertJsonPath('data.name', 'Camera');
        $category->delete();
        $this->postJson('/api/admin/categories', ['name' => 'Camera', 'slug' => 'new-category', 'status' => true])
            ->assertUnprocessable()->assertJsonValidationErrors('name');

        $brand = $this->brand('pixel');
        $otherBrand = $this->brand('other-brand');
        $this->postJson('/api/admin/brands', ['name' => ' PIXEL ', 'slug' => 'new-brand', 'status' => true])
            ->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->putJson("/api/admin/brands/{$otherBrand->id}", ['name' => 'Pixel', 'slug' => 'other-brand', 'status' => true])
            ->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->putJson("/api/admin/brands/{$brand->id}", ['name' => 'Pixel', 'slug' => 'pixel', 'status' => true])
            ->assertOk();
        $brand->delete();
        $this->postJson('/api/admin/brands', ['name' => 'Pixel', 'slug' => 'new-brand', 'status' => true])
            ->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->brand('điện-thoại')->update(['name' => 'Điện thoại']);
        $this->postJson('/api/admin/brands', ['name' => 'điện thoại', 'slug' => 'another-phone-brand', 'status' => true])
            ->assertUnprocessable()->assertJsonValidationErrors('name');

        $liveCategory = $this->category('live-category');
        $product = Product::create(['category_id' => $liveCategory->id, 'name' => 'Headphones', 'slug' => 'headphones', 'price' => 1000, 'status' => true]);
        $otherProduct = Product::create(['category_id' => $liveCategory->id, 'name' => 'Speakers', 'slug' => 'speakers', 'price' => 1000, 'status' => true]);
        $productPayload = ['category_id' => $liveCategory->id, 'name' => ' headphones ', 'slug' => 'new-product', 'price' => 1000, 'status' => true];
        $this->postJson('/api/admin/products', $productPayload)->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->putJson("/api/admin/products/{$otherProduct->id}", [...$productPayload, 'name' => 'HEADPHONES', 'slug' => 'speakers'])
            ->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->putJson("/api/admin/products/{$product->id}", [...$productPayload, 'name' => ' Headphones ', 'slug' => 'headphones'])
            ->assertOk()->assertJsonPath('data.name', 'Headphones');
        $product->delete();
        $this->postJson('/api/admin/products', $productPayload)->assertUnprocessable()->assertJsonValidationErrors('name');
    }

    public function test_sale_price_is_optional_lower_than_original_and_visible_in_public_api(): void
    {
        $category = $this->category('sale-category');
        $payload = ['category_id' => $category->id, 'name' => 'Sale Item', 'slug' => 'sale-item', 'price' => 1000, 'sale_price' => 750, 'status' => true];
        $created = $this->postJson('/api/admin/products', $payload)
            ->assertCreated()->assertJsonPath('data.price', '1000.00')->assertJsonPath('data.sale_price', '750.00');
        $id = $created->json('data.id');
        $this->assertDatabaseHas('products', ['id' => $id, 'sale_price' => 750]);
        $this->getJson('/api/products')->assertOk()->assertJsonPath('data.0.sale_price', '750.00');

        foreach ([1000, 1200, -1, '750.999'] as $invalidSalePrice) {
            $this->putJson("/api/admin/products/{$id}", [...$payload, 'sale_price' => $invalidSalePrice])
                ->assertUnprocessable()->assertJsonValidationErrors('sale_price');
        }

        $this->putJson("/api/admin/products/{$id}", [...$payload, 'sale_price' => null])
            ->assertOk()->assertJsonPath('data.sale_price', null);
        $this->assertDatabaseHas('products', ['id' => $id, 'sale_price' => null]);
        $this->postJson('/api/admin/products', [...$payload, 'name' => 'No Sale Item', 'slug' => 'no-sale-item', 'sale_price' => null])
            ->assertCreated()->assertJsonPath('data.sale_price', null);
    }

    public function test_admin_product_trash_restore_and_force_delete_lifecycle(): void
    {
        $category = $this->category('product-lifecycle-category');
        $product = Product::create(['category_id' => $category->id, 'name' => 'Lifecycle Product', 'slug' => 'lifecycle-product', 'price' => 1000, 'status' => true]);

        $this->deleteJson('/api/admin/products/9999')->assertNotFound();
        $this->deleteJson("/api/admin/products/{$product->id}")->assertOk();
        $this->getJson("/api/admin/products/{$product->id}")->assertNotFound();
        $this->getJson('/api/admin/products')->assertOk()->assertJsonMissing(['id' => $product->id]);
        $this->getJson('/api/admin/products/trash')->assertOk()->assertJsonFragment(['id' => $product->id]);
        $this->getJson("/api/admin/products/trash/{$product->id}")->assertOk()->assertJsonPath('data.deleted_at', fn ($value) => $value !== null);

        $this->postJson("/api/admin/products/{$product->id}/restore")->assertOk();
        $this->getJson("/api/admin/products/{$product->id}")->assertOk();
        $this->deleteJson("/api/admin/products/{$product->id}")->assertOk();
        $this->deleteJson("/api/admin/products/{$product->id}/force")->assertOk();
        $this->getJson("/api/admin/products/trash/{$product->id}")->assertNotFound();
    }

    public function test_product_restore_requires_live_category_and_brand(): void
    {
        $category = $this->category('trashed-product-parent');
        $brand = $this->brand('trashed-product-brand');
        $categoryProduct = Product::create(['category_id' => $category->id, 'brand_id' => $brand->id, 'name' => 'Trashed Category Product', 'slug' => 'trashed-category-product', 'price' => 1000, 'status' => true]);
        $categoryProduct->delete();
        $category->delete();
        $this->postJson("/api/admin/products/{$categoryProduct->id}/restore")->assertStatus(409);

        $this->postJson("/api/admin/categories/{$category->id}/restore")->assertOk();
        $this->postJson("/api/admin/products/{$categoryProduct->id}/restore")->assertOk();

        $brandProduct = Product::create(['category_id' => $category->id, 'brand_id' => $brand->id, 'name' => 'Trashed Brand Product', 'slug' => 'trashed-brand-restore-product', 'price' => 1000, 'status' => true]);
        $brandProduct->delete();
        $brand->delete();
        $this->postJson("/api/admin/products/{$brandProduct->id}/restore")->assertStatus(409);
    }

    public function test_public_products_exclude_unavailable_relations_and_paginate_twelve(): void
    {
        $visibleCategory = $this->category('public-visible-category');
        $hiddenCategory = $this->category('public-hidden-category', false);
        $trashedCategory = $this->category('public-trashed-category');
        $visibleBrand = $this->brand('public-visible-brand');
        $hiddenBrand = $this->brand('public-hidden-brand', false);
        $trashedBrand = $this->brand('public-trashed-brand');

        foreach (range(1, 13) as $number) {
            Product::create(['category_id' => $visibleCategory->id, 'brand_id' => $visibleBrand->id, 'name' => "Public {$number}", 'slug' => "public-{$number}", 'price' => 1000, 'status' => true]);
        }
        Product::create(['category_id' => $visibleCategory->id, 'name' => 'No Brand', 'slug' => 'no-brand', 'price' => 1000, 'status' => true]);
        Product::create(['category_id' => $hiddenCategory->id, 'name' => 'Hidden Category Product', 'slug' => 'hidden-category-product', 'price' => 1000, 'status' => true]);
        Product::create(['category_id' => $visibleCategory->id, 'brand_id' => $hiddenBrand->id, 'name' => 'Hidden Brand Product', 'slug' => 'hidden-brand-product-public', 'price' => 1000, 'status' => true]);
        Product::create(['category_id' => $visibleCategory->id, 'name' => 'Inactive Product', 'slug' => 'inactive-product', 'price' => 1000, 'status' => false]);
        $categoryProduct = Product::create(['category_id' => $trashedCategory->id, 'name' => 'Trashed Category Relation', 'slug' => 'trashed-category-relation', 'price' => 1000, 'status' => true]);
        $brandProduct = Product::create(['category_id' => $visibleCategory->id, 'brand_id' => $trashedBrand->id, 'name' => 'Trashed Brand Relation', 'slug' => 'trashed-brand-relation', 'price' => 1000, 'status' => true]);
        $trashedCategory->delete();
        $trashedBrand->delete();

        $first = $this->getJson('/api/products')->assertOk()->assertJsonCount(12, 'data')->assertJsonPath('meta.per_page', 12);
        $this->getJson('/api/products?page=2')->assertOk()->assertJsonCount(2, 'data');
        $first->assertJsonMissing(['slug' => 'hidden-category-product'])->assertJsonMissing(['slug' => 'hidden-brand-product-public'])->assertJsonMissing(['slug' => 'inactive-product'])->assertJsonMissing(['slug' => $categoryProduct->slug])->assertJsonMissing(['slug' => $brandProduct->slug])->assertJsonFragment(['slug' => 'no-brand']);
    }

    public function test_api_errors_are_in_vietnamese(): void
    {
        $this->postJson('/api/admin/categories', ['name' => 'Thiếu đường dẫn'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.slug.0', 'Trường đường dẫn là bắt buộc.');

        $this->getJson('/api/admin/categories/9999')
            ->assertNotFound()
            ->assertJsonPath('message', 'Không tìm thấy trang hoặc dữ liệu yêu cầu.');

        $category = $this->category('in-use');
        Product::create(['category_id' => $category->id, 'name' => 'Liên quan', 'slug' => 'lien-quan', 'price' => 1000, 'status' => true]);
        $this->deleteJson("/api/admin/categories/{$category->id}")
            ->assertStatus(409)
            ->assertJsonPath('message', 'Danh mục này vẫn có sản phẩm.');
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
