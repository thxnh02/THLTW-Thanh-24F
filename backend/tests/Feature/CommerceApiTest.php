<?php

namespace Tests\Feature;

use App\Mail\OrderEventMail;
use App\Models\Category;
use App\Models\CustomerNotification;
use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Models\Product;
use App\Models\User;
use App\Models\UserAddress;
use App\Support\CommerceNotification;
use App\Support\CommercePrice;
use App\Support\VnPayGateway;
use App\Support\VnPayQueryService;
use App\Support\VnPayReconciler;
use App\Support\VnPayTransition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
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
        $product = $this->product(5000, null, null);
        $this->signIn($user);
        $this->postJson('/api/account/cart/items', ['product_id' => $product->id, 'quantity' => 1])->assertOk();
        $checkout = $this->postJson('/api/account/orders', ['address_id' => $address->id, 'payment_method' => 'vnpay', 'idempotency_key' => (string) Str::uuid()])
            ->assertCreated()->assertJsonPath('data.order.payment_status', 'pending');
        $this->assertStringStartsWith('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?', $checkout->json('data.payment_url'));
        $this->assertStringContainsString('vnp_Amount=500000', $checkout->json('data.payment_url'));
        $this->assertStringNotContainsString('synthetic-secret-not-for-use', $checkout->json('data.payment_url'));
        $order = Order::query()->firstOrFail();
        $attempt = $order->paymentAttempts()->firstOrFail();
        $fields = ['vnp_TmnCode' => 'TESTMERCHANT', 'vnp_CurrCode' => 'VND', 'vnp_Amount' => '500000',
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
        $this->postJson('/api/auth/logout')->assertOk();
        $this->getJson('/api/payments/vnpay/return?'.http_build_query($fields))->assertUnauthorized();
    }

    public function test_price_rounds_vnd_without_float(): void
    {
        $this->assertSame(100, CommercePrice::vnd('100.49'));
        $this->assertSame(101, CommercePrice::vnd('100.50'));
        $this->assertNull(app(VnPayGateway::class)->assertAmount(VnPayGateway::MAX_VND));
        $this->expectException(ValidationException::class);
        app(VnPayGateway::class)->assertAmount(VnPayGateway::MAX_VND + 1);
    }

    public function test_vnpay_minimum_is_checked_before_order_or_stock_change_and_cod_one_dong_is_allowed(): void
    {
        $this->vnpayConfig();
        $user = $this->customer('minimum@example.test');
        $address = $this->address($user);
        $product = $this->product(4999, null, 3);
        $this->signIn($user);
        $this->postJson('/api/account/cart/items', ['product_id' => $product->id, 'quantity' => 1])->assertOk();
        $this->postJson('/api/account/orders', ['address_id' => $address->id, 'payment_method' => 'vnpay', 'idempotency_key' => (string) Str::uuid()])
            ->assertUnprocessable()->assertJsonValidationErrors('payment_method');
        $this->assertDatabaseCount('orders', 0);
        $this->assertSame(3, $product->fresh()->stock_quantity);
        $product->update(['price' => 5000]);
        $this->postJson('/api/account/orders', ['address_id' => $address->id, 'payment_method' => 'vnpay', 'idempotency_key' => (string) Str::uuid()])
            ->assertCreated()->assertJsonPath('data.order.grand_total_vnd', 5000);
        $this->assertSame(2, $product->fresh()->stock_quantity);
        $oneDong = $this->product(1, null, 1);
        $this->postJson('/api/account/orders', ['address_id' => $address->id, 'payment_method' => 'cod',
            'idempotency_key' => (string) Str::uuid(), 'buy_now_product_id' => $oneDong->id, 'buy_now_quantity' => 1])
            ->assertCreated()->assertJsonPath('data.order.grand_total_vnd', 1);
    }

    public function test_buy_now_uses_its_own_quantity_and_never_mutates_cart(): void
    {
        $user = $this->customer('buy-now@example.test');
        $address = $this->address($user);
        $product = $this->product(1000, null, 10);
        $other = $this->product(2000, null, 3);
        $this->signIn($user);
        $this->postJson('/api/account/cart/items', ['product_id' => $product->id, 'quantity' => 5])->assertOk();
        $this->postJson('/api/account/orders', ['address_id' => $address->id, 'payment_method' => 'cod',
            'idempotency_key' => (string) Str::uuid(), 'buy_now_product_id' => $product->id, 'buy_now_quantity' => 1])
            ->assertCreated()->assertJsonPath('data.order.items.0.quantity', 1);
        $this->getJson('/api/account/cart')->assertJsonPath('data.items.0.quantity', 5);
        $this->assertSame(9, $product->fresh()->stock_quantity);
        $this->postJson('/api/account/orders', ['address_id' => $address->id, 'payment_method' => 'cod',
            'idempotency_key' => (string) Str::uuid(), 'buy_now_product_id' => $other->id, 'buy_now_quantity' => 2])
            ->assertCreated()->assertJsonPath('data.order.items.0.quantity', 2);
        $this->getJson('/api/account/cart')->assertJsonPath('data.items.0.quantity', 5);
        $this->assertSame(1, $other->fresh()->stock_quantity);
        $this->postJson('/api/account/orders', ['address_id' => $address->id, 'payment_method' => 'cod',
            'idempotency_key' => (string) Str::uuid(), 'buy_now_product_id' => $other->id, 'buy_now_quantity' => 2])->assertUnprocessable();
        $this->assertDatabaseCount('orders', 2);
    }

    public function test_querydr_uses_its_own_fixed_order_hmac_and_validated_success_is_idempotent(): void
    {
        $this->queryConfig();
        $query = app(VnPayQueryService::class);
        $fields = ['vnp_RequestId' => 'RID1', 'vnp_Version' => '2.1.0', 'vnp_Command' => 'querydr',
            'vnp_TmnCode' => 'TESTMERCHANT', 'vnp_TxnRef' => 'TX123', 'vnp_TransactionDate' => '20261103120000',
            'vnp_CreateDate' => '20261103120100', 'vnp_IpAddr' => '127.0.0.1', 'vnp_OrderInfo' => 'Thanh toan don hang 1'];
        $this->assertSame(hash_hmac('sha512',
            'RID1|2.1.0|querydr|TESTMERCHANT|TX123|20261103120000|20261103120100|127.0.0.1|Thanh toan don hang 1',
            'synthetic-secret-not-for-use'), $query->requestHash($fields));
        $replyFields = ['vnp_ResponseId' => 'RID2', 'vnp_Command' => 'querydr', 'vnp_ResponseCode' => '00',
            'vnp_Message' => 'Success', 'vnp_TmnCode' => 'TESTMERCHANT', 'vnp_TxnRef' => 'TX123',
            'vnp_Amount' => '500000', 'vnp_BankCode' => 'NCB', 'vnp_PayDate' => '20261103120200',
            'vnp_TransactionNo' => '123456', 'vnp_TransactionType' => '01', 'vnp_TransactionStatus' => '00',
            'vnp_OrderInfo' => 'Thanh toan don hang 1', 'vnp_PromotionCode' => '', 'vnp_PromotionAmount' => ''];
        $this->assertSame(hash_hmac('sha512',
            'RID2|querydr|00|Success|TESTMERCHANT|TX123|500000|NCB|20261103120200|123456|01|00|Thanh toan don hang 1||',
            'synthetic-secret-not-for-use'), $query->responseHash($replyFields));

        $user = $this->customer('query-buyer@example.test');
        $address = $this->address($user);
        $product = $this->product(5000, null, 2);
        $this->signIn($user);
        $this->postJson('/api/account/orders', ['address_id' => $address->id, 'payment_method' => 'vnpay',
            'idempotency_key' => (string) Str::uuid(), 'buy_now_product_id' => $product->id, 'buy_now_quantity' => 1])->assertCreated();
        $order = Order::query()->firstOrFail();
        $attempt = $order->paymentAttempts()->firstOrFail();
        $user->forceFill(['email_verified_at' => now()])->save();
        $this->postJson('/api/admin/orders/'.$order->id.'/reconcile-payment', ['attempt_id' => $attempt->id])->assertForbidden();
        $this->postJson('/api/auth/logout')->assertOk();
        Http::fake(function ($request) use ($attempt) {
            $payload = $request->data();
            $this->assertSame('querydr', $payload['vnp_Command']);
            $this->assertSame($attempt->pay_created_at->copy()->setTimezone('Asia/Ho_Chi_Minh')->format('YmdHis'), $payload['vnp_TransactionDate']);
            $this->assertSame(app(VnPayQueryService::class)->requestHash($payload), $payload['vnp_SecureHash']);

            return Http::response($this->queryResponse($attempt, '00'), 200);
        });
        $admin = $this->customer('query-admin@example.test');
        $admin->forceFill(['is_admin' => true, 'email_verified_at' => now()])->save();
        $this->postJson('/api/admin/login', ['email' => $admin->email, 'password' => 'example-password'])->assertOk();
        $this->signIn($admin);
        $this->postJson('/api/admin/orders/'.$order->id.'/reconcile-payment', ['attempt_id' => $attempt->id])
            ->assertOk()->assertJsonPath('data.outcome', 'success')->assertJsonPath('data.order.payment_status', 'paid');
        $this->assertSame(1, $product->fresh()->stock_quantity);
        $this->assertDatabaseCount('customer_notifications', 2);
        $this->postJson('/api/admin/orders/'.$order->id.'/reconcile-payment', ['attempt_id' => $attempt->id])
            ->assertOk()->assertJsonPath('data.outcome', 'duplicate');
        $this->assertDatabaseCount('customer_notifications', 2);
        $this->assertDatabaseHas('payment_reconciliation_events', ['payment_attempt_id' => $attempt->id, 'outcome' => 'success']);
        $extra = $order->paymentAttempts()->create(['provider' => 'vnpay', 'txn_ref' => (string) Str::uuid(),
            'amount_vnd' => 5000, 'state' => 'pending', 'pay_created_at' => now(), 'pay_expires_at' => now()->addMinutes(15)]);
        $this->assertSame('review', app(VnPayTransition::class)->apply($extra->id, 'success', 'ipn', 'ipn_00', '999999', '00', '00', null, 5000));
        $this->assertSame('paid', $order->fresh()->payment_status);
        $this->assertTrue($order->fresh()->payment_review_required);
        $this->getJson('/api/admin/orders?payment_status=needs_review')->assertOk()->assertJsonPath('data.0.id', $order->id);
        $this->assertDatabaseCount('customer_notifications', 2);
    }

    public function test_expired_link_is_not_reused_until_query_confirms_failure_and_late_old_success_needs_review(): void
    {
        $this->queryConfig();
        $user = $this->customer('expired@example.test');
        $address = $this->address($user);
        $product = $this->product(5000, null, 3);
        $this->signIn($user);
        $this->postJson('/api/account/orders', ['address_id' => $address->id, 'payment_method' => 'vnpay',
            'idempotency_key' => (string) Str::uuid(), 'buy_now_product_id' => $product->id, 'buy_now_quantity' => 1])->assertCreated();
        $order = Order::query()->firstOrFail();
        $old = $order->paymentAttempts()->firstOrFail();
        $this->travel(16)->minutes();
        Http::fake(fn () => Http::response($this->queryResponse($old, '02'), 200));
        $this->postJson('/api/account/orders/'.$order->id.'/retry-payment')->assertOk();
        $new = $order->paymentAttempts()->latest('id')->firstOrFail();
        $this->assertNotSame($old->id, $new->id);
        $this->assertNotSame($old->txn_ref, $new->txn_ref);
        $this->assertSame('failed', $old->fresh()->state);
        $this->assertSame(2, $product->fresh()->stock_quantity); // Still reserved for the new attempt.
        $fields = ['vnp_TmnCode' => 'TESTMERCHANT', 'vnp_CurrCode' => 'VND', 'vnp_Amount' => '500000',
            'vnp_TxnRef' => $old->txn_ref, 'vnp_ResponseCode' => '00', 'vnp_TransactionStatus' => '00', 'vnp_TransactionNo' => '123456'];
        $fields['vnp_SecureHash'] = app(VnPayGateway::class)->sign($fields);
        $this->getJson('/api/payments/vnpay/ipn?'.http_build_query($fields))->assertJsonPath('RspCode', '00');
        $this->assertSame('needs_review', $order->fresh()->payment_status);
        $this->assertNull($order->fresh()->paid_at);
        $this->assertSame(2, $product->fresh()->stock_quantity);
        $this->postJson('/api/account/orders/'.$order->id.'/retry-payment')->assertUnprocessable();
        $this->assertDatabaseCount('payment_attempts', 2);
    }

    public function test_ambiguous_query_fails_closed_and_legacy_attempt_requires_manual_review(): void
    {
        $this->queryConfig();
        $user = $this->customer('ambiguous@example.test');
        $address = $this->address($user);
        $product = $this->product(5000, null, 2);
        $this->signIn($user);
        $this->postJson('/api/account/orders', ['address_id' => $address->id, 'payment_method' => 'vnpay',
            'idempotency_key' => (string) Str::uuid(), 'buy_now_product_id' => $product->id, 'buy_now_quantity' => 1])->assertCreated();
        $order = Order::query()->firstOrFail();
        $attempt = $order->paymentAttempts()->firstOrFail();
        $this->travel(16)->minutes();
        $response = $this->queryResponse($attempt, '04');
        Http::fake(fn () => Http::response($response, 200));
        $this->postJson('/api/account/orders/'.$order->id.'/retry-payment')->assertUnprocessable();
        $this->assertSame('needs_review', $order->fresh()->payment_status);
        $this->assertSame(1, $product->fresh()->stock_quantity);
        $this->assertDatabaseCount('payment_attempts', 1);
        $attempt->forceFill(['pay_created_at' => null, 'pay_expires_at' => null])->save();
        $this->postJson('/api/account/orders/'.$order->id.'/retry-payment')->assertUnprocessable();
        $this->assertSame('legacy_missing_pay_timestamp', $attempt->fresh()->review_reason);
        $this->assertDatabaseCount('payment_attempts', 1);
    }

    public function test_query_rejects_invalid_checksum_amount_merchant_reference_and_api_not_found(): void
    {
        $this->queryConfig();
        $user = $this->customer('query-invalid@example.test');
        $address = $this->address($user);
        $product = $this->product(5000, null, 2);
        $this->signIn($user);
        $this->postJson('/api/account/orders', ['address_id' => $address->id, 'payment_method' => 'vnpay',
            'idempotency_key' => (string) Str::uuid(), 'buy_now_product_id' => $product->id, 'buy_now_quantity' => 1])->assertCreated();
        $attempt = PaymentAttempt::query()->firstOrFail();
        $query = app(VnPayQueryService::class);
        $reply = [];
        $httpStatus = 200;
        $timeout = false;
        Http::fake(function () use (&$reply, &$httpStatus, &$timeout) {
            if ($timeout) {
                throw new ConnectionException('Synthetic timeout');
            }

            return Http::response($reply, $httpStatus);
        });
        foreach ([['vnp_TmnCode' => 'OTHER'], ['vnp_TxnRef' => 'OTHER'], ['vnp_Amount' => '1'],
            ['vnp_ResponseCode' => '91'], ['vnp_TransactionStatus' => '07']] as $overrides) {
            $reply = $this->queryResponse($attempt, '00', $overrides);
            $this->assertSame('review', $query->query($attempt)['outcome']);
        }
        $reply = $this->queryResponse($attempt, '00', ['vnp_BankCode' => '']);
        $this->assertSame('query_malformed', $query->query($attempt)['reason']);
        $bad = $this->queryResponse($attempt, '00');
        $bad['vnp_SecureHash'] = str_repeat('0', 128);
        $reply = $bad;
        $this->assertSame('query_invalid_signature', $query->query($attempt)['reason']);
        $httpStatus = 500;
        $this->assertSame('query_http_error', $query->query($attempt)['reason']);
        $timeout = true;
        $this->assertSame('query_network_error', $query->query($attempt)['reason']);
        $this->assertSame('pending', $attempt->fresh()->state);
    }

    public function test_admin_closes_only_verified_failed_order_and_restores_stock_once(): void
    {
        $this->vnpayConfig();
        $user = $this->customer('close-buyer@example.test');
        $address = $this->address($user);
        $product = $this->product(5000, null, 2);
        $this->signIn($user);
        $this->postJson('/api/account/orders', ['address_id' => $address->id, 'payment_method' => 'vnpay',
            'idempotency_key' => (string) Str::uuid(), 'buy_now_product_id' => $product->id, 'buy_now_quantity' => 1])->assertCreated();
        $order = Order::query()->firstOrFail();
        $user->forceFill(['email_verified_at' => now()])->save();
        $this->postJson('/api/admin/orders/'.$order->id.'/close-unpaid', ['reason' => 'Đã kiểm tra thất bại'])->assertForbidden();
        $this->postJson('/api/auth/logout')->assertOk();
        $admin = $this->customer('close-admin@example.test');
        $admin->forceFill(['is_admin' => true, 'email_verified_at' => now()])->save();
        $this->postJson('/api/admin/login', ['email' => $admin->email, 'password' => 'example-password'])->assertOk();
        $this->signIn($admin);
        $this->postJson('/api/admin/orders/'.$order->id.'/close-unpaid', ['reason' => 'Đã kiểm tra thất bại'])->assertUnprocessable();
        $attempt = $order->paymentAttempts()->firstOrFail();
        $fields = ['vnp_TmnCode' => 'TESTMERCHANT', 'vnp_CurrCode' => 'VND', 'vnp_Amount' => '500000',
            'vnp_TxnRef' => $attempt->txn_ref, 'vnp_ResponseCode' => '24', 'vnp_TransactionStatus' => '02'];
        $fields['vnp_SecureHash'] = app(VnPayGateway::class)->sign($fields);
        $this->getJson('/api/payments/vnpay/ipn?'.http_build_query($fields))->assertJsonPath('RspCode', '00');
        $this->postJson('/api/admin/orders/'.$order->id.'/close-unpaid', ['reason' => 'Đã kiểm tra thất bại'])
            ->assertOk()->assertJsonPath('data.status', 'cancelled');
        $this->assertSame(2, $product->fresh()->stock_quantity);
        $this->postJson('/api/admin/orders/'.$order->id.'/close-unpaid', ['reason' => 'Đã kiểm tra thất bại'])->assertUnprocessable();
        $this->assertSame(2, $product->fresh()->stock_quantity);
        $reversal = $fields;
        $reversal['vnp_ResponseCode'] = '00';
        $reversal['vnp_TransactionStatus'] = '04';
        $reversal['vnp_SecureHash'] = app(VnPayGateway::class)->sign($reversal);
        $this->getJson('/api/payments/vnpay/ipn?'.http_build_query($reversal))->assertJsonPath('RspCode', '00');
        $this->assertSame('cancelled', $order->fresh()->status);
        $this->assertTrue($order->fresh()->payment_review_required);
        $this->assertSame(2, $product->fresh()->stock_quantity);
    }

    public function test_query_91_never_releases_stock_and_stale_failure_cannot_undo_ipn_success(): void
    {
        $this->queryConfig();
        $user = $this->customer('race@example.test');
        $address = $this->address($user);
        $product = $this->product(5000, null, 2);
        $this->signIn($user);
        $this->postJson('/api/account/orders', ['address_id' => $address->id, 'payment_method' => 'vnpay',
            'idempotency_key' => (string) Str::uuid(), 'buy_now_product_id' => $product->id, 'buy_now_quantity' => 1])->assertCreated();
        $order = Order::query()->firstOrFail();
        $attempt = $order->paymentAttempts()->firstOrFail();
        $reply = $this->queryResponse($attempt, '01', ['vnp_ResponseCode' => '91']);
        $simulateIpn = false;
        Http::fake(function () use (&$reply, &$simulateIpn, $attempt) {
            if ($simulateIpn) {
                app(VnPayTransition::class)->apply($attempt->id, 'success', 'ipn', 'ipn_00', '123456', '00', '00', null, 5000);
            }

            return Http::response($reply, 200);
        });
        $this->assertSame('review', app(VnPayReconciler::class)->reconcile($attempt->id));
        $this->assertSame(1, $product->fresh()->stock_quantity);
        $this->assertSame('needs_review', $order->fresh()->payment_status);
        $reply = $this->queryResponse($attempt, '02');
        $simulateIpn = true;
        $this->assertSame('duplicate', app(VnPayReconciler::class)->reconcile($attempt->id));
        $this->assertSame('paid', $order->fresh()->payment_status);
        $this->assertSame(1, $product->fresh()->stock_quantity);
        $this->assertDatabaseCount('customer_notifications', 2);
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

    private function queryConfig(): void
    {
        $this->vnpayConfig();
        config()->set('commerce.vnpay.query_enabled', true);
        config()->set('commerce.vnpay.query_url', 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction');
        config()->set('commerce.vnpay.query_ip', '127.0.0.1');
    }

    private function queryResponse(PaymentAttempt $attempt, string $status, array $overrides = []): array
    {
        $fields = array_merge(['vnp_ResponseId' => 'RESPONSE1', 'vnp_Command' => 'querydr',
            'vnp_ResponseCode' => '00', 'vnp_Message' => 'Success', 'vnp_TmnCode' => 'TESTMERCHANT',
            'vnp_TxnRef' => $attempt->txn_ref, 'vnp_Amount' => (string) ($attempt->amount_vnd * 100),
            'vnp_BankCode' => 'NCB', 'vnp_PayDate' => '20261103120000', 'vnp_TransactionNo' => '123456',
            'vnp_TransactionType' => '01', 'vnp_TransactionStatus' => $status,
            'vnp_OrderInfo' => 'Thanh toan don hang '.$attempt->order_id,
            'vnp_PromotionCode' => '', 'vnp_PromotionAmount' => ''], $overrides);
        $fields['vnp_SecureHash'] = app(VnPayQueryService::class)->responseHash($fields);

        return $fields;
    }
}
