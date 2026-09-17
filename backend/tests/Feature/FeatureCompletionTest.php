<?php

namespace Tests\Feature;

use App\Models\CustomerNotification;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FeatureCompletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_return_request_restores_stock_once_and_finishes_refund(): void
    {
        $this->seed();
        $member = User::factory()->create();
        $admin = User::factory()->admin()->create();
        $variant = ProductVariant::query()->with('product')->firstOrFail();
        $order = $this->createOrder($member, $variant, 2, 'completed');
        $startingStock = $variant->stock_quantity;

        Sanctum::actingAs($member);
        $returnId = $this->postJson('/api/v1/account/returns', [
            'order_code' => $order->code,
            'reason' => 'San pham loi',
            'items' => [['order_item_id' => $order->items->first()->id, 'quantity' => 2]],
        ])->assertCreated()->json('data.id');

        Sanctum::actingAs($admin);
        $this->patchJson('/api/v1/admin/returns/'.$returnId.'/status', ['status' => 'approved'])
            ->assertOk()
            ->assertJsonPath('data.refund_status', 'pending');
        $this->patchJson('/api/v1/admin/returns/'.$returnId.'/status', ['status' => 'received'])->assertOk();
        $this->patchJson('/api/v1/admin/returns/'.$returnId.'/status', ['status' => 'received'])->assertOk();
        $this->patchJson('/api/v1/admin/returns/'.$returnId.'/status', ['refund_status' => 'refunded'])
            ->assertOk();
        $this->patchJson('/api/v1/admin/returns/'.$returnId.'/status', ['refund_status' => 'refunded'])
            ->assertOk();

        $this->assertSame($startingStock + 2, $variant->refresh()->stock_quantity);
        $this->assertSame(1, InventoryMovement::query()
            ->where('source_type', 'App\\Models\\ReturnRequest')
            ->where('source_id', $returnId)
            ->where('reason', 'return_received')
            ->count());
        $this->assertDatabaseHas('inventory_movements', [
            'source_type' => 'App\\Models\\ReturnRequest',
            'source_id' => $returnId,
            'reason' => 'return_received',
        ]);
        $this->assertDatabaseHas('return_requests', [
            'id' => $returnId,
            'status' => 'received',
            'refund_status' => 'refunded',
        ]);
        $this->assertDatabaseHas('customer_notifications', [
            'user_id' => $member->id,
            'type' => 'return_status',
        ]);
        $this->assertSame(1, $member->notifications()->where('type', 'refund_status')->count());
    }

    public function test_shipping_fee_is_calculated_server_side_and_snapshotted_on_order(): void
    {
        $this->seed();
        $method = ShippingMethod::query()->where('code', 'express')->firstOrFail();
        $variant = ProductVariant::query()->firstOrFail();

        $this->getJson('/api/v1/shipping-methods?subtotal=20000000')
            ->assertOk()
            ->assertJsonPath('data.1.fee', 0);

        $orderId = $this->postJson('/api/v1/checkout', [
            'customer' => [
                'name' => 'Shipping Test',
                'email' => 'shipping@example.com',
                'phone' => '0909009009',
                'address' => 'TP. Ho Chi Minh',
            ],
            'payment_method' => 'cod',
            'shipping_method_id' => $method->id,
            'idempotency_key' => 'shipping-snapshot-test',
            'items' => [['variant_id' => $variant->id, 'quantity' => 1]],
        ])->assertCreated()->json('data.id');

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'shipping_method_id' => $method->id,
            'shipping_method_name' => $method->name,
            'shipping_fee' => 60000,
        ]);
    }

    public function test_product_import_reports_validation_errors_without_partial_import(): void
    {
        $this->seed();
        Sanctum::actingAs(User::factory()->admin()->create());
        $csv = implode("\n", [
            'product_name,slug,category,brand,status,featured,sku,variant_name,price,sale_price,stock',
            'Valid Product,valid-product,Dien thoai,Apple,active,yes,CSV-VALID-001,Default,1000000,900000,5',
            'Invalid Product,invalid-product,Unknown,Apple,active,no,CSV-INVALID-001,Default,1000000,1100000,5',
        ]);

        $response = $this->post('/api/v1/admin/products/import', [
            'mode' => 'create',
            'file' => UploadedFile::fake()->createWithContent('products.csv', $csv),
        ])->assertOk();

        $response->assertJsonPath('data.total', 2)
            ->assertJsonPath('data.valid', 1)
            ->assertJsonPath('data.invalid', 1)
            ->assertJsonPath('data.imported', 0);
        $this->assertDatabaseMissing('product_variants', ['sku' => 'CSV-VALID-001']);
    }

    public function test_report_excludes_canceled_orders_from_valid_revenue_and_average(): void
    {
        $this->seed();
        $admin = User::factory()->admin()->create();
        Order::query()->delete();
        Order::factory()->create([
            'code' => 'ORD-REPORT-VALID',
            'status' => 'completed',
            'grand_total' => 100000,
            'created_at' => now()->subDay(),
        ]);
        Order::factory()->create([
            'code' => 'ORD-REPORT-CANCELED',
            'status' => 'canceled',
            'grand_total' => 90000,
            'created_at' => now()->subDay(),
        ]);

        Sanctum::actingAs($admin);
        $this->getJson('/api/v1/admin/reports/overview?range=custom&date_from='.now()->subDays(2)->toDateString().'&date_to='.now()->toDateString())
            ->assertOk()
            ->assertJsonPath('data.gross_revenue', 190000)
            ->assertJsonPath('data.valid_revenue', 100000)
            ->assertJsonPath('data.average_order_value', 100000)
            ->assertJsonPath('data.canceled_count', 1);
    }

    public function test_manager_and_staff_permissions_are_enforced_server_side(): void
    {
        $this->seed();
        Sanctum::actingAs(User::factory()->state(['role' => 'manager'])->create());
        $this->getJson('/api/v1/admin/reports/overview')->assertOk();
        $this->getJson('/api/v1/admin/users')->assertForbidden();

        Sanctum::actingAs(User::factory()->state(['role' => 'staff'])->create());
        $this->getJson('/api/v1/admin/orders')->assertOk();
        $this->getJson('/api/v1/admin/reports/overview')->assertForbidden();
    }

    public function test_notifications_are_private_and_can_be_marked_read(): void
    {
        $member = User::factory()->create();
        $otherMember = User::factory()->create();
        $notification = CustomerNotification::create([
            'user_id' => $member->id,
            'type' => 'order_status',
            'title' => 'Don hang da giao',
            'message' => 'Don hang cua ban da duoc giao.',
        ]);
        $otherNotification = CustomerNotification::create([
            'user_id' => $otherMember->id,
            'type' => 'order_status',
            'title' => 'Thong bao rieng',
            'message' => 'Khong duoc xem.',
        ]);

        Sanctum::actingAs($member);
        $this->getJson('/api/v1/account/notifications')
            ->assertOk()
            ->assertJsonPath('meta.unread_count', 1)
            ->assertJsonPath('data.data.0.id', $notification->id);
        $this->postJson('/api/v1/account/notifications/'.$notification->id.'/read')
            ->assertOk()
            ->assertJsonPath('data.id', $notification->id);
        $this->postJson('/api/v1/account/notifications/'.$otherNotification->id.'/read')->assertNotFound();
    }

    private function createOrder(User $user, ProductVariant $variant, int $quantity, string $status): Order
    {
        $unitPrice = (float) ($variant->sale_price ?? $variant->price);
        $order = Order::factory()->for($user)->create([
            'code' => 'ORD-RETURN-'.uniqid(),
            'status' => $status,
            'payment_status' => 'paid',
            'subtotal' => $unitPrice * $quantity,
            'grand_total' => $unitPrice * $quantity,
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

        return $order->load('items');
    }
}
