<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminBrandTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_update_and_delete_brand(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $brandId = $this->postJson('/api/v1/admin/brands', [
            'name' => 'Asus',
            'status' => 'active',
        ])->assertCreated()->json('data.id');

        $this->assertDatabaseHas('brands', [
            'id' => $brandId,
            'slug' => 'asus',
        ]);

        $this->patchJson('/api/v1/admin/brands/'.$brandId, [
            'name' => 'ASUS Vietnam',
            'slug' => 'asus-vietnam',
            'status' => 'inactive',
        ])->assertOk()->assertJsonPath('data.status', 'inactive');

        $this->deleteJson('/api/v1/admin/brands/'.$brandId)->assertOk();
        $this->assertSoftDeleted('brands', ['id' => $brandId]);
    }

    public function test_admin_cannot_delete_brand_with_products(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $brand = Brand::create(['name' => 'Protected', 'slug' => 'protected', 'status' => 'active']);
        $category = Category::create(['name' => 'Phones', 'slug' => 'phones', 'status' => 'active']);
        Product::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'name' => 'Protected Product',
            'slug' => 'protected-product',
            'status' => 'active',
        ]);

        $this->deleteJson('/api/v1/admin/brands/'.$brand->id)->assertStatus(409);
    }
}
