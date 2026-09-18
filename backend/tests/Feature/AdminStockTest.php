<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminStockTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_import_and_export_stock_with_movements(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $variant = $this->variant(5);

        $this->postJson('/api/v1/admin/stock', [
            'type' => 'import',
            'supplier' => 'Nha cung cap A',
            'items' => [
                ['product_variant_id' => $variant->id, 'quantity' => 4, 'unit_cost' => 100000],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.type', 'import');

        $this->assertSame(9, $variant->refresh()->stock_quantity);
        $this->assertDatabaseHas('inventory_movements', [
            'product_variant_id' => $variant->id,
            'quantity_change' => 4,
            'balance_after' => 9,
            'reason' => 'stock_import',
        ]);

        $this->postJson('/api/v1/admin/stock', [
            'type' => 'export',
            'reason' => 'Hang loi',
            'items' => [
                ['product_variant_id' => $variant->id, 'quantity' => 3],
            ],
        ])->assertCreated();

        $this->assertSame(6, $variant->refresh()->stock_quantity);
        $this->assertDatabaseHas('inventory_movements', [
            'product_variant_id' => $variant->id,
            'quantity_change' => -3,
            'balance_after' => 6,
            'reason' => 'stock_export',
        ]);
    }

    public function test_admin_cannot_export_stock_below_zero(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $variant = $this->variant(2);

        $this->postJson('/api/v1/admin/stock', [
            'type' => 'export',
            'items' => [
                ['product_variant_id' => $variant->id, 'quantity' => 3],
            ],
        ])->assertStatus(409);

        $this->assertSame(2, $variant->refresh()->stock_quantity);
        $this->assertDatabaseCount('stock_documents', 0);
        $this->assertDatabaseCount('inventory_movements', 0);
    }

    private function variant(int $stock): ProductVariant
    {
        $category = Category::create(['name' => 'Kho', 'slug' => 'kho', 'status' => 'active']);
        $brand = Brand::create(['name' => 'Kho Brand', 'slug' => 'kho-brand', 'status' => 'active']);
        $product = Product::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'name' => 'San pham kho',
            'slug' => 'san-pham-kho',
            'status' => 'active',
        ]);

        return ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'STOCK-SKU-'.$stock,
            'name' => 'Default',
            'price' => 1000000,
            'stock_quantity' => $stock,
            'active' => true,
            'is_default' => true,
        ]);
    }
}
