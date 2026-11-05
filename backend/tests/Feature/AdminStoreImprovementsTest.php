<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureAdminBrowserSession;
use App\Models\Category;
use App\Models\ContactMessage;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Queue;
use App\Jobs\DeliverOrderNotificationEmail;
use App\Models\CustomerNotification;
use App\Support\OrderNotificationDelivery;
use Tests\TestCase;

class AdminStoreImprovementsTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_counts_delivered_order_totals_and_current_work(): void
    {
        $this->getJson('/api/admin/dashboard')->assertUnauthorized();
        $user = User::create(['name' => 'Buyer', 'email' => 'buyer@example.test', 'password' => Hash::make('password')]);
        $delivered = new Order;
        $delivered->forceFill(['user_id' => $user->id, 'status' => 'delivered', 'grand_total_vnd' => 95000])->save();
        Order::create(['user_id' => $user->id, 'status' => 'pending']);
        ContactMessage::create(['name' => 'Buyer', 'email' => 'buyer@example.test', 'subject' => 'Question', 'message' => 'Hello']);
        $category = Category::create(['name' => 'Devices', 'slug' => 'devices', 'status' => true]);
        Product::create(['category_id' => $category->id, 'name' => 'Headset', 'slug' => 'headset', 'price' => 100000, 'status' => true, 'stock_quantity' => 3]);
        $this->withoutMiddleware(EnsureAdminBrowserSession::class);
        $this->getJson('/api/admin/dashboard')->assertOk()->assertJsonPath('data.orders_count', 2)
            ->assertJsonPath('data.delivered_count', 1)->assertJsonPath('data.delivered_total_vnd', 95000)
            ->assertJsonPath('data.pending_orders', 1)->assertJsonPath('data.low_stock', 1)->assertJsonPath('data.new_contacts', 1);
    }

    public function test_hidden_reviews_disappear_from_public_results_and_average(): void
    {
        $user = User::create(['name' => 'Buyer', 'email' => 'review@example.test', 'password' => Hash::make('password')]);
        $category = Category::create(['name' => 'Devices', 'slug' => 'devices', 'status' => true]);
        $product = Product::create(['category_id' => $category->id, 'name' => 'Headset', 'slug' => 'headset', 'price' => 100000, 'status' => true]);
        $order = Order::create(['user_id' => $user->id, 'status' => 'delivered']);
        $review = ProductReview::create(['user_id' => $user->id, 'product_id' => $product->id, 'order_id' => $order->id, 'rating' => 5, 'body' => 'Works very well.']);
        $this->patchJson('/api/admin/reviews/'.$review->id, ['is_visible' => false])->assertUnauthorized();
        $this->withoutMiddleware(EnsureAdminBrowserSession::class);
        $this->patchJson('/api/admin/reviews/'.$review->id, ['is_visible' => false])->assertOk();
        $this->getJson('/api/products/headset/reviews')->assertOk()->assertJsonPath('data.meta.total', 0)->assertJsonPath('data.meta.average_rating', null);
        $this->patchJson('/api/admin/reviews/'.$review->id, ['is_visible' => true])->assertOk();
        $this->getJson('/api/products/headset/reviews')->assertOk()->assertJsonPath('data.meta.total', 1);
    }

    public function test_shipping_and_product_scoped_coupon_are_recomputed_during_checkout(): void
    {
        config()->set('commerce.cod_enabled', true);
        SiteSetting::create(['id' => 1, 'shop_name' => 'Shop', 'shipping_fee_vnd' => 15000]);
        $user = User::create(['name' => 'Buyer', 'email' => 'coupon-scope@example.test', 'password' => Hash::make('password')]);
        $address = $user->addresses()->create(['label' => 'Home', 'recipient_name' => 'Buyer', 'recipient_phone' => '0912345678', 'province' => 'TP HCM', 'ward' => 'Bến Thành', 'street' => '1 Lê Lợi', 'is_default' => true]);
        $category = Category::create(['name' => 'Devices', 'slug' => 'devices', 'status' => true]);
        $first = Product::create(['category_id' => $category->id, 'name' => 'Headset', 'slug' => 'headset', 'price' => 100000, 'status' => true, 'stock_quantity' => 5]);
        $second = Product::create(['category_id' => $category->id, 'name' => 'Mouse', 'slug' => 'mouse', 'price' => 200000, 'status' => true, 'stock_quantity' => 5]);
        $coupon = Coupon::create(['code' => 'ONE', 'type' => 'percent', 'value' => 20, 'minimum_vnd' => 0, 'scope' => 'specific', 'per_customer_limit' => 1, 'active' => true]);
        $coupon->products()->attach($first->id);
        $this->withHeaders(['Origin' => 'http://127.0.0.1:3000', 'Accept' => 'application/json']);
        $this->app['auth']->forgetGuards();
        $this->withSession(['customer_auth_version' => 1])->actingAs($user->fresh());
        $this->postJson('/api/account/cart/items', ['product_id' => $first->id, 'quantity' => 1])->assertOk();
        $this->postJson('/api/account/cart/items', ['product_id' => $second->id, 'quantity' => 1])->assertOk();
        $this->postJson('/api/account/coupons/preview', ['code' => 'ONE'])->assertOk()->assertJsonPath('data.discount_vnd', 20000);
        $payload = ['address_id' => $address->id, 'payment_method' => 'cod', 'idempotency_key' => (string) Str::uuid(), 'coupon_code' => 'ONE', 'coupon_expected_subtotal' => 300000, 'coupon_expected_discount' => 20000, 'expected_shipping_fee_vnd' => 0];
        $this->postJson('/api/account/orders', $payload)->assertUnprocessable()->assertJsonValidationErrors('shipping');
        $payload['expected_shipping_fee_vnd'] = 15000;
        $this->postJson('/api/account/orders', $payload)->assertCreated()->assertJsonPath('data.order.grand_total_vnd', 295000);
        $this->assertDatabaseHas('orders', ['coupon_id' => $coupon->id, 'discount_vnd' => 20000]);
        $this->postJson('/api/account/cart/items', ['product_id' => $first->id, 'quantity' => 1])->assertOk();
        $this->postJson('/api/account/coupons/preview', ['code' => 'ONE'])->assertUnprocessable();
    }

    public function test_failed_new_email_is_scheduled_for_retry_but_sent_email_is_not(): void
    {
        Queue::fake();
        config()->set('commerce.order_email_enabled', true);
        $user = User::create(['name' => 'Buyer', 'email' => 'queue@example.test', 'password' => Hash::make('password')]);
        $order = Order::create(['user_id' => $user->id, 'status' => 'pending']);
        $notification = CustomerNotification::create(['user_id' => $user->id, 'order_id' => $order->id, 'event_key' => 'check-retry', 'title' => 'Title', 'message' => 'Message',
            'email_status' => 'failed', 'email_attempt_count' => 1, 'email_attempted_at' => now(), 'admin_email_status' => 'sent']);
        app(OrderNotificationDelivery::class)->scheduleRetryIfNeeded($notification->id);
        Queue::assertPushed(DeliverOrderNotificationEmail::class, fn ($job) => $job->notificationId === $notification->id && $job->retryDelivery && $job->delay !== null);
        $notification->forceFill(['email_status' => 'sent'])->save();
        app(OrderNotificationDelivery::class)->scheduleRetryIfNeeded($notification->id);
        Queue::assertPushed(DeliverOrderNotificationEmail::class, 1);
    }

    public function test_retry_does_not_overwrite_already_sent_email_status(): void
    {
        config()->set('commerce.order_email_enabled', true);
        $user = User::create(['name' => 'Buyer', 'email' => 'sent@example.test', 'password' => Hash::make('password')]);
        $user->forceFill(['blocked_at' => now()])->save();
        $order = Order::create(['user_id' => $user->id, 'status' => 'pending']);
        $notification = CustomerNotification::create(['user_id' => $user->id, 'order_id' => $order->id,
            'event_key' => 'sent-state', 'title' => 'Title', 'message' => 'Message',
            'email_status' => 'sent', 'email_attempt_count' => 1, 'admin_email_status' => 'sent', 'admin_email_attempt_count' => 1]);
        app(OrderNotificationDelivery::class)->retry($notification->id);
        $this->assertSame('sent', $notification->fresh()->email_status);
        $this->assertSame('sent', $notification->fresh()->admin_email_status);
    }

    public function test_admin_can_only_queue_due_email_for_the_matching_order(): void
    {
        Queue::fake();
        config()->set('commerce.order_email_enabled', true);
        $user = User::create(['name' => 'Buyer', 'email' => 'retry@example.test', 'password' => Hash::make('password')]);
        $order = Order::create(['user_id' => $user->id, 'status' => 'pending']);
        $other = Order::create(['user_id' => $user->id, 'status' => 'pending']);
        $notification = CustomerNotification::create(['user_id' => $user->id, 'order_id' => $order->id,
            'event_key' => 'retry-state', 'title' => 'Title', 'message' => 'Message',
            'email_status' => 'failed', 'email_attempt_count' => 1, 'email_attempted_at' => now(), 'admin_email_status' => 'skipped']);
        $path = '/api/admin/orders/'.$order->id.'/notifications/'.$notification->id.'/retry-email';
        $this->postJson($path)->assertUnauthorized();
        $this->withoutMiddleware(EnsureAdminBrowserSession::class);
        $this->postJson('/api/admin/orders/'.$other->id.'/notifications/'.$notification->id.'/retry-email')->assertNotFound();
        $this->postJson($path)->assertUnprocessable();
        $notification->forceFill(['email_attempted_at' => now()->subMinutes(2)])->save();
        $this->postJson($path)->assertOk();
        Queue::assertPushed(DeliverOrderNotificationEmail::class, fn ($job) => $job->notificationId === $notification->id && $job->retryDelivery);
    }

    public function test_selected_product_coupon_never_becomes_global_when_selected_products_are_removed(): void
    {
        $category = Category::create(['name' => 'Devices', 'slug' => 'devices', 'status' => true]);
        $first = Product::create(['category_id' => $category->id, 'name' => 'Headset', 'slug' => 'headset', 'price' => 100000, 'status' => true]);
        $second = Product::create(['category_id' => $category->id, 'name' => 'Mouse', 'slug' => 'mouse', 'price' => 100000, 'status' => true]);
        $user = User::create(['name' => 'Buyer', 'email' => 'scope@example.test', 'password' => Hash::make('password')]);
        $coupon = Coupon::create(['code' => 'SCOPED', 'type' => 'fixed', 'value' => 10000, 'minimum_vnd' => 0, 'scope' => 'specific', 'active' => true]);
        $coupon->products()->attach($first->id);
        $first->forceDelete();
        $this->withHeaders(['Origin' => 'http://127.0.0.1:3000', 'Accept' => 'application/json']);
        $this->app['auth']->forgetGuards();
        $this->withSession(['customer_auth_version' => 1])->actingAs($user->fresh());
        $this->postJson('/api/account/cart/items', ['product_id' => $second->id, 'quantity' => 1])->assertOk();
        $this->postJson('/api/account/coupons/preview', ['code' => 'SCOPED'])->assertUnprocessable()->assertJsonValidationErrors('coupon_code');
    }

    public function test_admin_can_create_and_change_coupon_product_scope(): void
    {
        $category = Category::create(['name' => 'Devices', 'slug' => 'devices', 'status' => true]);
        $product = Product::create(['category_id' => $category->id, 'name' => 'Headset', 'slug' => 'headset', 'price' => 100000, 'status' => true]);
        $payload = ['code' => 'scope10', 'type' => 'percent', 'value' => 10, 'minimum_vnd' => 0,
            'active' => true, 'scope' => 'specific', 'per_customer_limit' => 1, 'product_ids' => []];
        $this->postJson('/api/admin/coupons', $payload)->assertUnauthorized();
        $this->withoutMiddleware(EnsureAdminBrowserSession::class);
        $this->postJson('/api/admin/coupons', $payload)->assertUnprocessable()->assertJsonValidationErrors('product_ids');
        $payload['product_ids'] = [$product->id];
        $id = $this->postJson('/api/admin/coupons', $payload)->assertCreated()
            ->assertJsonPath('data.scope', 'specific')->assertJsonPath('data.products.0.id', $product->id)->json('data.id');
        $this->putJson('/api/admin/coupons/'.$id, [...$payload, 'scope' => 'all', 'product_ids' => []])->assertOk()->assertJsonPath('data.scope', 'all');
        $this->assertDatabaseMissing('coupon_products', ['coupon_id' => $id, 'product_id' => $product->id]);
    }
}
