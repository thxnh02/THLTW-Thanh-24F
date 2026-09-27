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

    public function test_admin_and_staff_can_load_all_product_variant_options(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'staff']));
        [$product, $variants] = $this->productWithVariants();

        $response = $this->getJson('/api/v1/admin/options/product-variants')->assertOk();

        $response->assertJsonCount(3, 'data')
            ->assertJsonStructure(['data' => [['id', 'sku', 'name', 'stock_quantity', 'active', 'product' => ['id', 'name']]]]);
        $this->assertEqualsCanonicalizing(
            array_map(fn (ProductVariant $variant): int => $variant->id, $variants),
            array_column($response->json('data'), 'id'),
        );
        $this->assertSame($product->name, $response->json('data.0.product.name'));
    }

    public function test_member_cannot_load_product_variant_options(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'member']));

        $this->getJson('/api/v1/admin/options/product-variants')->assertForbidden();
    }

    public function test_non_default_variants_can_be_imported_and_exported_independently(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        [, $variants] = $this->productWithVariants();
        $default = $variants[0];
        $middle = $variants[1];
        $largest = $variants[2];

        $this->postJson('/api/v1/admin/stock', [
            'type' => 'import',
            'items' => [['product_variant_id' => $middle->id, 'quantity' => 3]],
        ])->assertCreated();

        $this->postJson('/api/v1/admin/stock', [
            'type' => 'export',
            'items' => [['product_variant_id' => $largest->id, 'quantity' => 1]],
        ])->assertCreated();

        $this->assertSame(10, $default->refresh()->stock_quantity);
        $this->assertSame(8, $middle->refresh()->stock_quantity);
        $this->assertSame(1, $largest->refresh()->stock_quantity);
        $this->assertDatabaseHas('stock_document_items', ['product_variant_id' => $middle->id, 'quantity' => 3]);
        $this->assertDatabaseHas('stock_document_items', ['product_variant_id' => $largest->id, 'quantity' => 1]);
        $this->assertDatabaseHas('inventory_movements', ['product_variant_id' => $middle->id, 'balance_after' => 8]);
        $this->assertDatabaseHas('inventory_movements', ['product_variant_id' => $largest->id, 'balance_after' => 1]);
    }

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

    /**
     * @return array{Product, array<int, ProductVariant>}
     */
    private function productWithVariants(): array
    {
        $category = Category::create(['name' => 'Multi Variant Category', 'slug' => 'multi-variant-category', 'status' => 'active']);
        $brand = Brand::create(['name' => 'Multi Variant Brand', 'slug' => 'multi-variant-brand', 'status' => 'active']);
        $product = Product::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'name' => 'Phone X',
            'slug' => 'phone-x',
            'status' => 'active',
        ]);

        return [$product, [
            ProductVariant::create(['product_id' => $product->id, 'sku' => 'PHONE-X-128', 'name' => '128GB', 'price' => 1000000, 'stock_quantity' => 10, 'active' => true, 'is_default' => true]),
            ProductVariant::create(['product_id' => $product->id, 'sku' => 'PHONE-X-256', 'name' => '256GB', 'price' => 1200000, 'stock_quantity' => 5, 'active' => true, 'is_default' => false]),
            ProductVariant::create(['product_id' => $product->id, 'sku' => 'PHONE-X-512', 'name' => '512GB', 'price' => 1500000, 'stock_quantity' => 2, 'active' => true, 'is_default' => false]),
        ]];
    }
}
