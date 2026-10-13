<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Payment;
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
            ->assertJsonPath('data.order.payment_status', 'paid')
            ->assertJsonPath('data.payment.transaction_ref', '123456')
            ->assertJsonMissingPath('data.payment.transaction_id')
            ->assertJsonMissingPath('data.payment.provider_payload');

        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'status' => 'paid',
            'transaction_ref' => '123456',
        ]);
        $this->assertNotNull($order->payment()->firstOrFail()->refresh()->paid_at);
    }

    public function test_vnpay_failed_return_stores_reference_without_paid_at(): void
    {
        config(['services.vnpay.hash_secret' => 'secret']);
        $order = $this->createVnpayOrder('ORD-VNPAY-FAILED');

        $params = [
            'vnp_Amount' => '100000000',
            'vnp_ResponseCode' => '24',
            'vnp_TransactionNo' => '654321',
            'vnp_TransactionStatus' => '02',
            'vnp_TxnRef' => $order->code,
        ];

        $this->getJson('/api/v1/vnpay/return?'.$this->signedQuery($params))
            ->assertOk()
            ->assertJsonPath('data.order.payment_status', 'failed')
            ->assertJsonPath('data.payment.status', 'failed')
            ->assertJsonPath('data.payment.transaction_ref', '654321')
            ->assertJsonPath('data.payment.paid_at', null);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'payment_status' => 'failed',
        ]);
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'status' => 'failed',
            'transaction_ref' => '654321',
        ]);
        $this->assertNull($order->payment()->firstOrFail()->refresh()->paid_at);
    }

    public function test_vnpay_already_paid_callback_preserves_paid_at_and_does_not_downgrade(): void
    {
        config(['services.vnpay.hash_secret' => 'secret']);
        $order = $this->createVnpayOrder('ORD-VNPAY-PAID');
        $paidAt = now()->subHour();
        $payment = $order->payment()->firstOrFail();
        $payment->update([
            'status' => 'paid',
            'transaction_ref' => 'original-ref',
            'paid_at' => $paidAt,
            'provider_payload' => ['original' => true],
        ]);
        $order->update(['payment_status' => 'paid']);

        $params = [
            'vnp_Amount' => '100000000',
            'vnp_ResponseCode' => '24',
            'vnp_TransactionNo' => 'new-ref',
            'vnp_TransactionStatus' => '02',
            'vnp_TxnRef' => $order->code,
        ];

        $this->getJson('/api/v1/vnpay/return?'.$this->signedQuery($params))
            ->assertOk()
            ->assertJsonPath('data.order.payment_status', 'paid')
            ->assertJsonPath('data.payment.status', 'paid')
            ->assertJsonPath('data.payment.transaction_ref', 'original-ref');

        $payment = $payment->refresh();
        $this->assertSame('paid', $payment->status);
        $this->assertSame('original-ref', $payment->transaction_ref);
        $this->assertSame($paidAt->timestamp, $payment->paid_at?->timestamp);
        $this->assertSame(['original' => true], $payment->provider_payload);
    }

    private function createVnpayOrder(string $code): Order
    {
        $order = Order::create([
            'code' => $code,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => 'vnpay',
            'customer_name' => 'VNPay User',
            'customer_email' => $code.'@example.com',
            'customer_phone' => '0909009009',
            'shipping_address' => 'TPHCM',
            'subtotal' => 1000000,
            'discount_total' => 0,
            'shipping_fee' => 0,
            'grand_total' => 1000000,
        ]);
        Payment::create([
            'order_id' => $order->id,
            'method' => 'vnpay',
            'status' => 'pending',
            'amount' => 1000000,
        ]);

        return $order;
    }

    private function signedQuery(array $params): string
    {
        ksort($params);
        $params['vnp_SecureHash'] = hash_hmac('sha512', http_build_query($params, '', '&', PHP_QUERY_RFC3986), 'secret');

        return http_build_query($params);
    }
}
