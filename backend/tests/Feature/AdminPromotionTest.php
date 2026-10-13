<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Promotion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminPromotionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_update_list_and_delete_promotion(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $promotionId = $this->postJson('/api/v1/admin/promotions', [
            'code' => 'sale20',
            'type' => 'percent',
            'value' => 20,
            'min_order_amount' => 500000,
            'max_discount_amount' => 100000,
            'start_at' => now()->subDay()->toISOString(),
            'end_at' => now()->addWeek()->toISOString(),
            'active' => true,
            'usage_limit' => 100,
            'usage_limit_per_user' => 1,
        ])->assertCreated()
            ->assertJsonPath('data.code', 'SALE20')
            ->json('data.id');

        $this->getJson('/api/v1/admin/promotions?q=sale')
            ->assertOk()
            ->assertJsonPath('data.data.0.code', 'SALE20');

        $this->patchJson('/api/v1/admin/promotions/'.$promotionId, [
            'code' => 'sale25',
            'type' => 'fixed',
            'value' => 25000,
            'min_order_amount' => 0,
            'active' => false,
        ])->assertOk()
            ->assertJsonPath('data.code', 'SALE25')
            ->assertJsonPath('data.active', false);

        $this->deleteJson('/api/v1/admin/promotions/'.$promotionId)->assertOk();
        $this->assertDatabaseMissing('promotions', ['id' => $promotionId]);
    }

    public function test_admin_promotion_rejects_percent_value_above_100(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->postJson('/api/v1/admin/promotions', [
            'code' => 'TOO-MUCH',
            'type' => 'percent',
            'value' => 101,
            'active' => true,
        ])->assertUnprocessable();
    }

    public function test_admin_cannot_delete_promotion_used_by_order(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $promotion = Promotion::create([
            'code' => 'USED10',
            'type' => 'percent',
            'value' => 10,
            'active' => true,
        ]);
        Order::create([
            'code' => 'ORD-PROMOTION-USED',
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => 'cod',
            'customer_name' => 'Promotion User',
            'customer_email' => 'promotion-user@example.com',
            'customer_phone' => '0909009009',
            'shipping_address' => 'TP. Ho Chi Minh',
            'subtotal' => 1000000,
            'discount_total' => 100000,
            'shipping_fee' => 30000,
            'grand_total' => 930000,
            'promotion_code' => $promotion->code,
        ]);

        $this->deleteJson('/api/v1/admin/promotions/'.$promotion->id)->assertStatus(409);
    }
}
