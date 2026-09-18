<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminProductCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_and_update_product_with_variants_and_images(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        [$category, $brand] = $this->catalogParents();

        $productId = $this->postJson('/api/v1/admin/products', $this->productPayload($category, $brand))
            ->assertCreated()
            ->assertJsonPath('data.variants.0.sku', 'ADMIN-SKU-1')
            ->json('data.id');

        $this->assertDatabaseHas('product_variants', [
            'product_id' => $productId,
            'sku' => 'ADMIN-SKU-1',
            'is_default' => true,
        ]);
        $this->assertDatabaseHas('product_images', [
            'product_id' => $productId,
            'path' => '/product-placeholder.svg',
            'is_primary' => true,
        ]);

        $this->patchJson('/api/v1/admin/products/'.$productId, [
            ...$this->productPayload($category, $brand),
            'name' => 'Admin Product Updated',
            'slug' => 'admin-product-updated',
            'variants' => [
                [
                    'id' => ProductVariant::query()->where('product_id', $productId)->firstOrFail()->id,
                    'sku' => 'ADMIN-SKU-1-UPDATED',
                    'name' => 'Default',
                    'price' => 1500000,
                    'sale_price' => 1200000,
                    'stock_quantity' => 8,
                    'active' => true,
                    'is_default' => true,
                ],
            ],
        ])->assertOk()->assertJsonPath('data.slug', 'admin-product-updated');

        $this->assertDatabaseHas('product_variants', [
            'product_id' => $productId,
            'sku' => 'ADMIN-SKU-1-UPDATED',
            'stock_quantity' => 8,
        ]);
    }

    public function test_admin_product_validation_rejects_sale_price_above_price(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        [$category, $brand] = $this->catalogParents();

        $payload = $this->productPayload($category, $brand);
        $payload['variants'][0]['sale_price'] = 2000000;
        $payload['variants'][0]['price'] = 1000000;

        $this->postJson('/api/v1/admin/products', $payload)->assertUnprocessable();
    }

    public function test_admin_deleting_product_with_order_soft_deletes_and_inactivates_it(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        [$category, $brand] = $this->catalogParents();
        $product = Product::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'name' => 'Ordered Product',
            'slug' => 'ordered-product',
            'status' => 'active',
        ]);
        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'ORDERED-SKU',
            'name' => 'Default',
            'price' => 1000000,
            'stock_quantity' => 3,
            'active' => true,
            'is_default' => true,
        ]);
        $order = Order::create([
            'code' => 'ORD-PROD-'.uniqid(),
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => 'cod',
            'customer_name' => 'Buyer',
            'customer_email' => 'buyer@example.com',
            'customer_phone' => '0900000000',
            'shipping_address' => 'TP. Ho Chi Minh',
            'subtotal' => 1000000,
            'discount_total' => 0,
            'shipping_fee' => 30000,
            'grand_total' => 1030000,
        ]);
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'product_name' => $product->name,
            'variant_name' => $variant->name,
            'sku' => $variant->sku,
            'unit_price' => 1000000,
            'quantity' => 1,
            'subtotal' => 1000000,
        ]);

        $this->deleteJson('/api/v1/admin/products/'.$product->id)->assertOk();

        $this->assertSoftDeleted('products', ['id' => $product->id]);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'status' => 'inactive']);
    }

    /**
     * @return array{Category, Brand}
     */
    private function catalogParents(): array
    {
        return [
            Category::create(['name' => 'Admin Category', 'slug' => 'admin-category', 'status' => 'active']),
            Brand::create(['name' => 'Admin Brand', 'slug' => 'admin-brand', 'status' => 'active']),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function productPayload(Category $category, Brand $brand): array
    {
        return [
            'name' => 'Admin Product',
            'slug' => 'admin-product',
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'short_description' => 'Short admin product',
            'description' => 'Long admin product description',
            'status' => 'active',
            'featured' => true,
            'variants' => [
                [
                    'sku' => 'ADMIN-SKU-1',
                    'name' => 'Default',
                    'price' => 1000000,
                    'sale_price' => 900000,
                    'stock_quantity' => 5,
                    'active' => true,
                    'is_default' => true,
                ],
            ],
            'images' => [
                [
                    'path' => '/product-placeholder.svg',
                    'alt_text' => 'Admin Product',
                    'is_primary' => true,
                    'sort_order' => 1,
                ],
            ],
        ];
    }
}
