<?php

namespace Tests\Feature;

use App\Mail\OrderEventMail;
use App\Models\Category;
use App\Models\CustomerNotification;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\UserAddress;
use App\Support\CommerceNotification;
use App\Support\CommercePrice;
use App\Support\VnPayGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class CommerceApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeaders(['Origin' => 'http://127.0.0.1:3000', 'Accept' => 'application/json']);
        config()->set('commerce.cod_demo_enabled', true);
    }

    public function test_unverified_customer_cart_checkout_idempotency_and_stock(): void
    {
        $user = $this->customer('buyer@example.test');
        $address = $this->address($user);
        $product = $this->product(1001, 900, 3);
        $this->signIn($user);
        $this->postJson('/api/account/cart/items', ['product_id' => $product->id, 'quantity' => 2])
            ->assertOk()->assertJsonPath('data.subtotal_vnd', 1800);
        $product->update(['sale_price' => 800]); // Server must recalculate at checkout.
        $this->getJson('/api/account/cart')->assertOk()->assertJsonPath('data.items.0.price_changed', true)
            ->assertJsonPath('data.subtotal_vnd', 1600);
        $key = (string) Str::uuid();
        $payload = ['address_id' => $address->id, 'payment_method' => 'cod', 'idempotency_key' => $key];
        $this->postJson('/api/account/orders', $payload)->assertCreated()
            ->assertJsonPath('data.order.payment_status', 'demo_paid')
            ->assertJsonPath('data.order.grand_total_vnd', 1600)
            ->assertJsonPath('data.order.status', 'pending');
        $order = Order::query()->firstOrFail();
        $this->assertNull($order->paid_at);
        $this->assertSame(1, $order->items()->count());
        $this->assertSame(800, $order->items()->firstOrFail()->unit_price_vnd);
        $this->assertSame(1, $product->fresh()->stock_quantity);
        $this->assertDatabaseHas('customer_notifications', ['order_id' => $order->id, 'event_key' => 'order:'.$order->id.':demo_paid']);
        $this->postJson('/api/account/orders', $payload)->assertCreated()->assertJsonPath('data.order.id', $order->id);
        $this->assertSame(1, Order::query()->count());
        $this->assertSame(1, $order->fresh()->items()->count());
        $this->assertDatabaseCount('customer_notifications', 1);
        $this->assertSame(1, $product->fresh()->stock_quantity);
        $address->update(['street' => 'Changed later']);
        $this->assertSame('1 Lê Lợi', $order->fresh()->shipping_snapshot['street']);
        $this->postJson('/api/account/orders/'.$order->id.'/cancel')->assertOk()->assertJsonPath('data.status', 'cancelled');
        $this->assertSame(3, $product->fresh()->stock_quantity);
        $this->postJson('/api/account/orders/'.$order->id.'/cancel')->assertUnprocessable();
        $this->assertSame(3, $product->fresh()->stock_quantity);
    }

    public function test_cart_and_order_are_owner_scoped_and_stock_is_enforced(): void
    {
        $first = $this->customer('first@example.test');
        $second = $this->customer('second@example.test');
        $address = $this->address($first);
        $product = $this->product(1000, null, 1);
        $this->signIn($first);
        $this->postJson('/api/account/cart/items', ['product_id' => $product->id, 'quantity' => 2])->assertUnprocessable();
        $this->postJson('/api/account/cart/items', ['product_id' => $product->id, 'quantity' => 1])->assertOk();
        $this->postJson('/api/account/orders', ['address_id' => $address->id, 'payment_method' => 'cod', 'idempotency_key' => (string) Str::uuid()])->assertCreated();
        $orderId = Order::query()->firstOrFail()->id;
        $notificationId = CustomerNotification::query()->firstOrFail()->id;
        $this->postJson('/api/auth/logout')->assertOk();
        $this->signIn($second);
        $this->getJson('/api/account/orders/'.$orderId)->assertNotFound();
        $this->postJson('/api/account/orders/'.$orderId.'/cancel')->assertNotFound();
        $this->postJson('/api/account/orders', ['address_id' => $address->id, 'payment_method' => 'cod', 'idempotency_key' => (string) Str::uuid()])->assertNotFound();
        $this->getJson('/api/account/notifications')->assertOk()->assertJsonPath('data.unread_count', 0);
        $this->patchJson('/api/account/notifications/'.$notificationId.'/read')->assertNotFound();
    }

    public function test_vnpay_ipn_signature_amount_and_return_cannot_fake_payment(): void
    {
        $this->vnpayConfig();
        $user = $this->customer('gateway@example.test');
        $address = $this->address($user);
        $product = $this->product(1500, null, null);
        $this->signIn($user);
        $this->postJson('/api/account/cart/items', ['product_id' => $product->id, 'quantity' => 1])->assertOk();
        $checkout = $this->postJson('/api/account/orders', ['address_id' => $address->id, 'payment_method' => 'vnpay', 'idempotency_key' => (string) Str::uuid()])
            ->assertCreated()->assertJsonPath('data.order.payment_status', 'pending');
        $this->assertStringStartsWith('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?', $checkout->json('data.payment_url'));
        $this->assertStringContainsString('vnp_Amount=150000', $checkout->json('data.payment_url'));
        $this->assertStringNotContainsString('synthetic-secret-not-for-use', $checkout->json('data.payment_url'));
        $order = Order::query()->firstOrFail();
        $attempt = $order->paymentAttempts()->firstOrFail();
        $fields = ['vnp_TmnCode' => 'TESTMERCHANT', 'vnp_CurrCode' => 'VND', 'vnp_Amount' => '150000',
            'vnp_TxnRef' => $attempt->txn_ref, 'vnp_ResponseCode' => '00', 'vnp_TransactionStatus' => '00', 'vnp_TransactionNo' => 'SYNTHETIC123'];
        $fields['vnp_SecureHash'] = app(VnPayGateway::class)->sign($fields);
        $this->getJson('/api/payments/vnpay/return?'.http_build_query($fields))->assertOk();
        $this->assertSame('pending', $order->fresh()->payment_status);
        $invalid = $fields;
        $invalid['vnp_Amount'] = '1';
        $this->getJson('/api/payments/vnpay/ipn?'.http_build_query($invalid))->assertJsonPath('RspCode', '97');
        $invalid['vnp_SecureHash'] = app(VnPayGateway::class)->sign($invalid);
        $this->getJson('/api/payments/vnpay/ipn?'.http_build_query($invalid))->assertJsonPath('RspCode', '04');
        $wrongMerchant = $fields;
        $wrongMerchant['vnp_TmnCode'] = 'OTHER';
        $wrongMerchant['vnp_SecureHash'] = app(VnPayGateway::class)->sign($wrongMerchant);
        $this->getJson('/api/payments/vnpay/ipn?'.http_build_query($wrongMerchant))->assertJsonPath('RspCode', '04');
        $wrongRef = $fields;
        $wrongRef['vnp_TxnRef'] = (string) Str::uuid();
        $wrongRef['vnp_SecureHash'] = app(VnPayGateway::class)->sign($wrongRef);
        $this->getJson('/api/payments/vnpay/ipn?'.http_build_query($wrongRef))->assertJsonPath('RspCode', '01');
        $incomplete = $fields;
        $incomplete['vnp_TransactionStatus'] = '01';
        $incomplete['vnp_SecureHash'] = app(VnPayGateway::class)->sign($incomplete);
        $this->getJson('/api/payments/vnpay/ipn?'.http_build_query($incomplete))->assertJsonPath('RspCode', '99');
        $this->assertSame('pending', $order->fresh()->payment_status);
        $this->getJson('/api/payments/vnpay/ipn?'.http_build_query($fields))->assertJsonPath('RspCode', '00');
        $this->assertSame('paid', $order->fresh()->payment_status);
        $this->getJson('/api/payments/vnpay/ipn?'.http_build_query($fields))->assertJsonPath('RspCode', '02');
        $this->assertSame(1, $order->fresh()->paymentAttempts()->where('state', 'succeeded')->count());
    }

    public function test_price_rounds_vnd_without_float(): void
    {
        $this->assertSame(100, CommercePrice::vnd('100.49'));
        $this->assertSame(101, CommercePrice::vnd('100.50'));
    }

    public function test_order_email_is_optional_and_unverified_customer_receives_only_in_app_notice(): void
    {
        Mail::fake();
        config()->set('commerce.order_email_enabled', true);
        $user = $this->customer('mail@example.test');
        $order = Order::query()->create(['user_id' => $user->id, 'status' => 'pending']);
        CommerceNotification::order($order, 'demo_paid', 'Đặt hàng thành công', 'Đặt hàng và thanh toán thành công (mô phỏng).');
        Mail::assertNothingSent();
        $this->assertDatabaseHas('customer_notifications', ['order_id' => $order->id]);
        $user->forceFill(['email_verified_at' => now()])->save();
        CommerceNotification::order($order, 'processing', 'Đơn đang xử lý', 'Đơn hàng đang được xử lý.');
        Mail::assertSent(OrderEventMail::class);
    }

    public function test_vnpay_fails_closed_without_credentials(): void
    {
        config()->set('commerce.vnpay.enabled', false);
        $this->getJson('/api/commerce/options')->assertOk()->assertJsonPath('data.vnpay_sandbox_enabled', false);
        $this->getJson('/api/payments/vnpay/ipn?vnp_ResponseCode=00')->assertJsonPath('RspCode', '97');
    }

    public function test_cart_requires_live_unblocked_session_and_rejects_fractional_quantity(): void
    {
        $this->getJson('/api/account/cart')->assertUnauthorized();
        $this->withHeader('Accept', 'text/html')->get('/api/account/cart')->assertUnauthorized();
        $this->withHeader('Accept', 'application/json');
        $user = $this->customer('blocked-cart@example.test');
        $product = $this->product(1000, null, null);
        $this->signIn($user);
        $this->postJson('/api/account/cart/items', ['product_id' => $product->id, 'quantity' => 1.5])->assertUnprocessable();
        $user->forceFill(['blocked_at' => now()])->save();
        $this->getJson('/api/account/cart')->assertUnauthorized();
        $user->forceFill(['blocked_at' => null, 'customer_auth_version' => 2])->save();
        $this->getJson('/api/account/cart')->assertUnauthorized();
    }

    private function signIn(User $user): void
    {
        $this->app['auth']->forgetGuards();
        $this->withSession(['customer_auth_version' => 1])->actingAs($user);
    }

    private function customer(string $email): User
    {
        return User::query()->create(['name' => 'Synthetic customer', 'email' => $email, 'password' => Hash::make('example-password')])->fresh();
    }

    private function address(User $user): UserAddress
    {
        return $user->addresses()->create(['label' => 'Nhà', 'recipient_name' => 'Nguyễn An', 'recipient_phone' => '0912345678',
            'province' => 'TP HCM', 'ward' => 'Bến Thành', 'street' => '1 Lê Lợi', 'is_default' => true]);
    }

    private function product(int $price, ?int $sale, ?int $stock): Product
    {
        $category = Category::query()->create(['name' => 'Demo category', 'slug' => (string) Str::uuid(), 'status' => true]);

        return Product::query()->create(['category_id' => $category->id, 'name' => 'Demo product',
            'slug' => (string) Str::uuid(), 'price' => $price, 'sale_price' => $sale, 'status' => true, 'stock_quantity' => $stock]);
    }

    private function vnpayConfig(): void
    {
        config()->set('commerce.vnpay', ['enabled' => true, 'tmn_code' => 'TESTMERCHANT', 'hash_secret' => 'synthetic-secret-not-for-use',
            'payment_url' => 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', 'return_url' => 'https://shop.example.test/payment-result',
            'ipn_url' => 'https://api.example.test/api/payments/vnpay/ipn']);
    }
}
