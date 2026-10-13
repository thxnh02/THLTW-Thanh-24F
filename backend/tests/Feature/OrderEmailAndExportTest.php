<?php

namespace Tests\Feature;

use App\Mail\OrderConfirmationMail;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OrderEmailAndExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_sends_order_confirmation_email_after_order_created(): void
    {
        Mail::fake();
        $this->seed();
        $variant = ProductVariant::query()->firstOrFail();

        $this->postJson('/api/v1/checkout', [
            'customer' => [
                'name' => 'Nguyen Van Email',
                'email' => 'order-email@example.com',
                'phone' => '0909009009',
                'address' => 'Quan 1, TP. Ho Chi Minh',
            ],
            'payment_method' => 'cod',
            'idempotency_key' => 'mail-key-1',
            'items' => [
                ['variant_id' => $variant->id, 'quantity' => 1],
            ],
        ])->assertCreated();

        Mail::assertSent(OrderConfirmationMail::class, function (OrderConfirmationMail $mail): bool {
            return $mail->order->customer_email === 'order-email@example.com';
        });
    }

    public function test_admin_can_export_products_and_orders_as_csv(): void
    {
        Mail::fake();
        $this->seed();
        $admin = User::factory()->admin()->create();
        $variant = ProductVariant::query()->firstOrFail();

        $this->postJson('/api/v1/checkout', [
            'customer' => [
                'name' => 'Nguyen Van CSV',
                'email' => 'csv@example.com',
                'phone' => '0909009009',
                'address' => 'Quan 1, TP. Ho Chi Minh',
            ],
            'payment_method' => 'cod',
            'idempotency_key' => 'csv-key-1',
            'items' => [
                ['variant_id' => $variant->id, 'quantity' => 1],
            ],
        ])->assertCreated();

        $this->actingAs($admin)
            ->get('/api/v1/admin/products/export')
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $this->actingAs($admin)
            ->get('/api/v1/admin/orders/export')
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }

    public function test_member_can_open_own_invoice_and_cannot_open_another_order(): void
    {
        $this->seed();
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $order = Order::factory()->for($user)->create(['code' => 'ORD-OWN-1']);
        $otherOrder = Order::factory()->for($otherUser)->create(['code' => 'ORD-OTHER-1']);

        $this->actingAs($user)
            ->get('/api/v1/account/orders/'.$order->code.'/invoice')
            ->assertOk()
            ->assertSee($order->code);

        $this->actingAs($user)
            ->get('/api/v1/account/orders/'.$otherOrder->code.'/invoice')
            ->assertNotFound();
    }
}
