<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_and_search_orders(): void
    {
        $this->seed();
        Sanctum::actingAs(User::factory()->admin()->create());
        $order = $this->createOrder('pending');

        $this->getJson('/api/v1/admin/orders?q='.$order->code)
            ->assertOk()
            ->assertJsonPath('data.data.0.code', $order->code);
    }

    public function test_admin_can_transition_order_forward_and_history_is_recorded(): void
    {
        $this->seed();
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);
        $order = $this->createOrder('pending');

        $this->patchJson('/api/v1/admin/orders/'.$order->id.'/status', [
            'status' => 'confirmed',
            'note' => 'Da goi xac nhan',
        ])->assertOk()->assertJsonPath('data.status', 'confirmed');

        $this->assertDatabaseHas('order_status_histories', [
            'order_id' => $order->id,
            'changed_by' => $admin->id,
            'from_status' => 'pending',
            'to_status' => 'confirmed',
        ]);
    }

    public function test_admin_cannot_transition_completed_order_back_to_pending(): void
    {
        $this->seed();
        Sanctum::actingAs(User::factory()->admin()->create());
        $order = $this->createOrder('completed');

        $this->patchJson('/api/v1/admin/orders/'.$order->id.'/status', [
            'status' => 'pending',
        ])->assertStatus(409);
    }

    public function test_admin_cancel_restores_stock_once(): void
    {
        $this->seed();
        Sanctum::actingAs(User::factory()->admin()->create());
        $variant = ProductVariant::query()->firstOrFail();
        $startingStock = $variant->stock_quantity;
        $order = $this->createOrder('confirmed', $variant, 3);

        $this->patchJson('/api/v1/admin/orders/'.$order->id.'/status', [
            'status' => 'canceled',
        ])->assertOk()->assertJsonPath('data.status', 'canceled');

        $this->assertSame($startingStock + 3, $variant->refresh()->stock_quantity);
        $this->assertDatabaseHas('inventory_movements', [
            'product_variant_id' => $variant->id,
            'quantity_change' => 3,
            'reason' => 'admin_order_cancel',
        ]);

        $this->patchJson('/api/v1/admin/orders/'.$order->id.'/status', [
            'status' => 'canceled',
        ])->assertOk();

        $this->assertSame($startingStock + 3, $variant->refresh()->stock_quantity);
    }

    private function createOrder(string $status, ?ProductVariant $variant = null, int $quantity = 1): Order
    {
        $variant ??= ProductVariant::query()->with('product')->firstOrFail();
        $unitPrice = (float) ($variant->sale_price ?? $variant->price);

        $order = Order::create([
            'code' => 'ORD-ADMIN-'.uniqid(),
            'status' => $status,
            'payment_status' => $status === 'completed' ? 'paid' : 'unpaid',
            'payment_method' => 'cod',
            'customer_name' => 'Khach admin test',
            'customer_email' => 'admin-order@example.com',
            'customer_phone' => '0900000000',
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

        Payment::create([
            'order_id' => $order->id,
            'method' => 'cod',
            'status' => $status === 'completed' ? 'paid' : 'pending',
            'amount' => ($unitPrice * $quantity) + 30000,
        ]);

        return $order;
    }
}
