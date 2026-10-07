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

class AccountEnhancementTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_manage_addresses_and_default_address(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $firstId = $this->postJson('/api/v1/account/addresses', [
            'recipient_name' => 'Nguyen Van A',
            'phone' => '0909009009',
            'province' => 'TPHCM',
            'address_line' => 'Quan 1',
            'is_default' => true,
        ])->assertCreated()
            ->assertJsonPath('data.is_default', true)
            ->json('data.id');

        $secondId = $this->postJson('/api/v1/account/addresses', [
            'recipient_name' => 'Nguyen Van B',
            'phone' => '0909009000',
            'province' => 'TPHCM',
            'address_line' => 'Quan 3',
            'is_default' => true,
        ])->assertCreated()
            ->json('data.id');

        $this->assertDatabaseHas('addresses', ['id' => $firstId, 'is_default' => false]);
        $this->assertDatabaseHas('addresses', ['id' => $secondId, 'is_default' => true]);

        $this->deleteJson('/api/v1/account/addresses/'.$firstId)->assertOk();
        $this->assertDatabaseMissing('addresses', ['id' => $firstId]);
    }

    public function test_member_can_add_and_remove_wishlist_item(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        [$product] = $this->productWithVariant();

        $this->postJson('/api/v1/wishlist', [
            'product_id' => $product->id,
        ])->assertCreated();

        $this->getJson('/api/v1/wishlist')
            ->assertOk()
            ->assertJsonPath('data.0.product_id', $product->id);

        $this->deleteJson('/api/v1/wishlist/'.$product->id)->assertOk();
        $this->assertDatabaseMissing('wishlists', [
            'user_id' => $user->id,
            'product_id' => $product->id,
        ]);
    }

    public function test_member_can_review_only_completed_order_product(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        [$product, $variant] = $this->productWithVariant();

        $this->postJson('/api/v1/products/'.$product->id.'/reviews', [
            'rating' => 5,
            'content' => 'Rat tot.',
        ])->assertStatus(409);

        $order = Order::create([
            'user_id' => $user->id,
            'code' => 'ORD-REVIEW-1',
            'status' => 'completed',
            'payment_status' => 'paid',
            'payment_method' => 'cod',
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'customer_phone' => '0909009009',
            'shipping_address' => 'TPHCM',
            'subtotal' => 1000000,
            'discount_total' => 0,
            'shipping_fee' => 0,
            'grand_total' => 1000000,
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

        $this->postJson('/api/v1/products/'.$product->id.'/reviews', [
            'rating' => 5,
            'content' => 'Rat tot.',
        ])->assertCreated();

        $this->assertDatabaseHas('reviews', [
            'user_id' => $user->id,
            'product_id' => $product->id,
            'rating' => 5,
        ]);
    }

    /**
     * @return array{0: Product, 1: ProductVariant}
     */
    private function productWithVariant(): array
    {
        $category = Category::create(['name' => 'Review Category', 'slug' => 'review-category', 'status' => 'active']);
        $brand = Brand::create(['name' => 'Review Brand', 'slug' => 'review-brand', 'status' => 'active']);
        $product = Product::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'name' => 'Review Product',
            'slug' => 'review-product',
            'status' => 'active',
        ]);
        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'REVIEW-SKU',
            'name' => 'Default',
            'price' => 1000000,
            'stock_quantity' => 5,
            'active' => true,
            'is_default' => true,
        ]);

        return [$product, $variant];
    }
}
