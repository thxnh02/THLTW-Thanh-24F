<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VnpayPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_with_vnpay_returns_payment_url(): void
    {
        config([
            'services.vnpay.tmn_code' => 'TESTCODE',
            'services.vnpay.hash_secret' => 'secret',
            'services.vnpay.url' => 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
            'services.vnpay.return_url' => 'http://localhost:8000/api/v1/vnpay/return',
        ]);
        $this->seed();
        $variant = ProductVariant::query()->firstOrFail();

        $this->postJson('/api/v1/checkout', [
            'customer' => [
                'name' => 'Nguyen Van A',
                'email' => 'vnpay@example.com',
                'phone' => '0909009009',
                'address' => 'Quan 1, TP. Ho Chi Minh',
            ],
            'payment_method' => 'vnpay',
            'idempotency_key' => 'test-vnpay-key',
            'items' => [
                ['variant_id' => $variant->id, 'quantity' => 1],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.payment.method', 'vnpay')
            ->assertJson(fn ($json) => $json->where('success', true)->has('data.payment_url')->etc());
    }

    public function test_vnpay_return_verifies_signature_and_marks_payment_paid(): void
    {
        config(['services.vnpay.hash_secret' => 'secret']);
        $order = Order::create([
            'code' => 'ORD-VNPAY-1',
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => 'vnpay',
            'customer_name' => 'VNPay User',
            'customer_email' => 'vnpay-return@example.com',
            'customer_phone' => '0909009009',
            'shipping_address' => 'TPHCM',
            'subtotal' => 1000000,
            'discount_total' => 0,
            'shipping_fee' => 0,
            'grand_total' => 1000000,
        ]);
        $order->payment()->create([
            'method' => 'vnpay',
            'status' => 'pending',
            'amount' => 1000000,
        ]);

        $params = [
            'vnp_Amount' => '100000000',
            'vnp_ResponseCode' => '00',
            'vnp_TransactionNo' => '123456',
            'vnp_TransactionStatus' => '00',
            'vnp_TxnRef' => $order->code,
        ];
        ksort($params);
        $params['vnp_SecureHash'] = hash_hmac('sha512', http_build_query($params, '', '&', PHP_QUERY_RFC3986), 'secret');

        $this->getJson('/api/v1/vnpay/return?'.http_build_query($params))
            ->assertOk()
            ->assertJsonPath('data.order.payment_status', 'paid');

        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'status' => 'paid',
            'transaction_ref' => '123456',
        ]);
    }
}
