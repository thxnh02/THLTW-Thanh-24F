<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Coupon;
use App\Models\Product;
use App\Models\User;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;
use App\Http\Middleware\EnsureAdminBrowserSession;

class CouponCheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_coupon_management_requires_admin_and_validates_limits(): void
    {
        $payload = ['code' => 'sale10', 'type' => 'percent', 'value' => 10, 'minimum_vnd' => 1000, 'active' => true];
        $this->postJson('/api/admin/coupons', $payload)->assertUnauthorized();
        $this->withoutMiddleware(EnsureAdminBrowserSession::class);
        $this->postJson('/api/admin/coupons', [...$payload, 'value' => 101])->assertUnprocessable();
        $id = $this->postJson('/api/admin/coupons', $payload)->assertCreated()->assertJsonPath('data.code', 'SALE10')->json('data.id');
        $this->postJson('/api/admin/coupons', $payload)->assertUnprocessable();
        $this->putJson('/api/admin/coupons/'.$id, [...$payload, 'active' => false])->assertOk()->assertJsonPath('data.active', false);
        $this->deleteJson('/api/admin/coupons/'.$id)->assertNoContent();
    }

    public function test_discount_is_validated_and_calculated_again_when_creating_order(): void
    {
        config()->set('commerce.cod_enabled', true);
        config()->set('commerce.shipping_fee_vnd', 0);
        $user = User::create(['name' => 'Customer', 'email' => 'coupon@example.test', 'password' => Hash::make('password')]);
        $address = $user->addresses()->create(['label' => 'Home', 'recipient_name' => 'Customer', 'recipient_phone' => '0912345678',
            'province' => 'TP HCM', 'ward' => 'Bến Thành', 'street' => '1 Lê Lợi', 'is_default' => true]);
        $category = Category::create(['name' => 'Category', 'slug' => 'category', 'status' => true]);
        $product = Product::create(['category_id' => $category->id, 'name' => 'Product', 'slug' => 'product', 'price' => 10000, 'status' => true, 'stock_quantity' => 3]);
        $coupon = Coupon::create(['code' => 'SAVE20', 'type' => 'percent', 'value' => 20, 'minimum_vnd' => 10000, 'usage_limit' => 1, 'active' => true]);
        $this->withHeaders(['Origin' => 'http://127.0.0.1:3000', 'Accept' => 'application/json']);
        $this->app['auth']->forgetGuards();
        $this->withSession(['customer_auth_version' => 1])->actingAs($user->fresh());
        $this->postJson('/api/account/cart/items', ['product_id' => $product->id, 'quantity' => 1])->assertOk();
        $this->postJson('/api/account/coupons/preview', ['code' => 'save20'])->assertOk()->assertJsonPath('data.discount_vnd', 2000);
        $product->update(['price' => 20000]);
        $payload = ['address_id' => $address->id, 'payment_method' => 'cod', 'idempotency_key' => (string) Str::uuid(),
            'coupon_code' => 'save20', 'coupon_expected_subtotal' => 10000, 'coupon_expected_discount' => 2000, 'discount_vnd' => 999999];
        $this->postJson('/api/account/orders', $payload)->assertUnprocessable()->assertJsonValidationErrors('coupon_code');
        $this->assertSame(3, $product->fresh()->stock_quantity);
        $payload['coupon_expected_subtotal'] = 20000;
        $payload['coupon_expected_discount'] = 4000;
        $response = $this->postJson('/api/account/orders', $payload)->assertCreated()
            ->assertJsonPath('data.order.discount_vnd', 4000)->assertJsonPath('data.order.grand_total_vnd', 16000);
        $this->postJson('/api/account/orders', $payload)->assertCreated()->assertJsonPath('data.order.id', $response->json('data.order.id'));
        $this->assertSame(1, $coupon->fresh()->used_count);
        $this->postJson('/api/account/cart/items', ['product_id' => $product->id, 'quantity' => 1])->assertOk();
        $this->postJson('/api/account/coupons/preview', ['code' => 'SAVE20'])->assertUnprocessable();
        $this->postJson('/api/account/orders', [...$payload, 'idempotency_key' => (string) Str::uuid()])->assertUnprocessable();
        $this->assertSame(2, $product->fresh()->stock_quantity);
    }

    public function test_bestsellers_only_include_completed_orders_and_visible_products(): void
    {
        $user = User::create(['name' => 'Customer', 'email' => 'sales@example.test', 'password' => Hash::make('password')]);
        $category = Category::create(['name' => 'Category', 'slug' => 'category', 'status' => true]);
        $first = Product::create(['category_id' => $category->id, 'name' => 'First', 'slug' => 'first', 'price' => 10000, 'status' => true]);
        $second = Product::create(['category_id' => $category->id, 'name' => 'Second', 'slug' => 'second', 'price' => 10000, 'status' => true]);
        $delivered = Order::create(['user_id' => $user->id, 'status' => 'delivered']);
        $pending = Order::create(['user_id' => $user->id, 'status' => 'pending']);
        foreach ([[$delivered, $first, 1], [$delivered, $second, 2], [$pending, $first, 10]] as [$order, $product, $quantity]) {
            $order->items()->create(['product_id' => $product->id, 'product_name' => $product->name, 'product_slug' => $product->slug,
                'unit_price_vnd' => 10000, 'quantity' => $quantity, 'line_total_vnd' => 10000 * $quantity]);
        }
        $this->getJson('/api/products/bestsellers')->assertOk()->assertJsonPath('data.0.id', $second->id)->assertJsonPath('data.1.id', $first->id);
        $second->update(['status' => false]);
        $this->getJson('/api/products/bestsellers')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $first->id);
    }

    public function test_search_finds_description_and_admin_records_with_filters(): void
    {
        $first = User::create(['name' => 'Alice', 'email' => 'alice@example.test', 'password' => Hash::make('password')]);
        $second = User::create(['name' => 'Bob', 'email' => 'bob@example.test', 'password' => Hash::make('password')]);
        $second->forceFill(['blocked_at' => now()])->save();
        $category = Category::create(['name' => 'Category', 'slug' => 'category', 'status' => true]);
        Product::create(['category_id' => $category->id, 'name' => 'Laptop', 'slug' => 'laptop', 'description' => 'Special keyboard', 'price' => 10000, 'status' => true]);
        Order::create(['user_id' => $first->id, 'status' => 'pending']);
        Order::create(['user_id' => $second->id, 'status' => 'pending']);
        $this->getJson('/api/products?q=keyboard')->assertOk()->assertJsonCount(1, 'data');
        $this->withoutMiddleware(EnsureAdminBrowserSession::class);
        $this->getJson('/api/admin/users?q=bob&status=blocked')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $second->id);
        $this->getJson('/api/admin/users?q=bob&status=active')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/admin/orders?q=alice')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.user.id', $first->id);
        $this->getJson('/api/admin/products?q=laptop&status=1')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/admin/products?q=laptop&status=0')->assertOk()->assertJsonCount(0, 'data');
    }
}
