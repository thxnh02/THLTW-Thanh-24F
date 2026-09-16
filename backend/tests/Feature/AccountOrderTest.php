<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_view_own_order_detail(): void
    {
        $this->seed();
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $order = $this->createOrderForUser($user, 'pending');

        $this->getJson('/api/v1/account/orders/'.$order->code)
            ->assertOk()
            ->assertJsonPath('data.code', $order->code);
    }

    public function test_member_cancel_pending_order_restores_stock_once(): void
    {
        $this->seed();
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $variant = ProductVariant::query()->firstOrFail();
        $startingStock = $variant->stock_quantity;
        $order = $this->createOrderForUser($user, 'pending', $variant, 2);

        $this->postJson('/api/v1/account/orders/'.$order->code.'/cancel')
            ->assertOk()
            ->assertJsonPath('data.status', 'canceled');

        $this->assertSame($startingStock + 2, $variant->refresh()->stock_quantity);
        $this->assertDatabaseHas('inventory_movements', [
            'product_variant_id' => $variant->id,
            'quantity_change' => 2,
            'reason' => 'order_cancel',
        ]);

        $this->postJson('/api/v1/account/orders/'.$order->code.'/cancel')->assertStatus(409);
        $this->assertSame($startingStock + 2, $variant->refresh()->stock_quantity);
    }

    public function test_member_cannot_cancel_completed_order(): void
    {
        $this->seed();
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $order = $this->createOrderForUser($user, 'completed');

        $this->postJson('/api/v1/account/orders/'.$order->code.'/cancel')->assertStatus(409);
    }

    private function createOrderForUser(User $user, string $status, ?ProductVariant $variant = null, int $quantity = 1): Order
    {
        $variant ??= ProductVariant::query()->with('product')->firstOrFail();
        $unitPrice = (float) ($variant->sale_price ?? $variant->price);

        $order = Order::create([
            'user_id' => $user->id,
            'code' => 'ORD-TEST-'.uniqid(),
            'status' => $status,
            'payment_status' => $status === 'completed' ? 'paid' : 'unpaid',
            'payment_method' => 'cod',
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'customer_phone' => $user->phone ?? '0900000000',
            'shipping_address' => 'TP. Ho Chi Minh',
            'subtotal' => $unitPrice * $quantity,
            'discount_total' => 0,
            'shipping_fee' => 30000,
            'grand_total' => ($unitPrice * $quantity) + 30000,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $variant->product_id,
            'product_variant_id' => $variant->id,
            'product_name' => $variant->product->name,
            'variant_name' => $variant->name,
            'sku' => $variant->sku,
            'unit_price' => $unitPrice,
            'quantity' => $quantity,
            'subtotal' => $unitPrice * $quantity,
        ]);

        return $order;
    }
}
