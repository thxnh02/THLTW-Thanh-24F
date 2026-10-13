<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_categories_only_returns_active_root_categories_with_children(): void
    {
        $root = Category::create(['name' => 'Root', 'slug' => 'root', 'sort_order' => 1, 'status' => true]);
        Category::create(['parent_id' => $root->id, 'name' => 'Child', 'slug' => 'child', 'sort_order' => 1, 'status' => true]);
        Category::create(['name' => 'Hidden', 'slug' => 'hidden', 'status' => false]);

        $this->getJson('/api/categories')->assertOk()->assertJsonPath('data.0.slug', 'root')->assertJsonCount(1, 'data.0.children');
        $this->getJson('/api/categories/missing')->assertNotFound();
    }

    public function test_products_are_paginated_twelve_per_page(): void
    {
        $category = Category::create(['name' => 'Root', 'slug' => 'root', 'status' => true]);
        $brand = Brand::create(['name' => 'Brand', 'slug' => 'brand', 'status' => true]);
        foreach (range(1, 14) as $number) {
            Product::create(['category_id' => $category->id, 'brand_id' => $brand->id, 'name' => "Product {$number}", 'slug' => "product-{$number}", 'price' => 1000, 'status' => true]);
        }
        $this->getJson('/api/products')->assertOk()->assertJsonCount(12, 'data')->assertJsonPath('meta.per_page', 12);
        $this->getJson('/api/products?page=2')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_admin_category_crud_validates_and_blocks_related_delete(): void
    {
        $this->postJson('/api/admin/categories', ['name' => 'No slug'])->assertUnprocessable();
        $created = $this->postJson('/api/admin/categories', ['name' => 'New', 'slug' => 'new', 'sort_order' => 1, 'status' => true])->assertCreated();
        $id = $created->json('data.id');
        $this->putJson("/api/admin/categories/{$id}", ['name' => 'Updated', 'slug' => 'updated', 'sort_order' => 2, 'status' => false])->assertOk()->assertJsonPath('data.slug', 'updated');
        Product::create(['category_id' => $id, 'name' => 'Related', 'slug' => 'related', 'price' => 1000, 'status' => true]);
        $this->deleteJson("/api/admin/categories/{$id}")->assertStatus(409);
    }

    public function test_admin_brand_crud_and_related_delete_rule(): void
    {
        $brand = Brand::create(['name' => 'Brand', 'slug' => 'brand', 'status' => true]);
        $this->getJson('/api/admin/brands')->assertOk()->assertJsonPath('data.0.slug', 'brand');
        $category = Category::create(['name' => 'Root', 'slug' => 'root', 'status' => true]);
        Product::create(['category_id' => $category->id, 'brand_id' => $brand->id, 'name' => 'Related', 'slug' => 'related', 'price' => 1000, 'status' => true]);
        $this->deleteJson("/api/admin/brands/{$brand->id}")->assertStatus(409);
    }
}
