<?php

namespace Tests\Feature;

use App\Models\ProductVariant;
use App\Models\Promotion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_decrements_stock_and_creates_order(): void
    {
        $this->seed();
        $variant = ProductVariant::query()->firstOrFail();
        $startingStock = $variant->stock_quantity;

        $response = $this->postJson('/api/v1/checkout', [
            'customer' => [
                'name' => 'Nguyen Van A',
                'email' => 'a@example.com',
                'phone' => '0909009009',
                'address' => 'Quan 1, TP. Ho Chi Minh',
            ],
            'payment_method' => 'cod',
            'idempotency_key' => 'test-key-1',
            'items' => [
                ['variant_id' => $variant->id, 'quantity' => 2],
            ],
        ]);

        $orderId = $response->assertCreated()->assertJsonPath('success', true)->json('data.id');
        $this->assertDatabaseHas('orders', ['idempotency_key' => 'test-key-1']);
        $this->assertDatabaseHas('order_items', [
            'order_id' => $orderId,
            'product_variant_id' => $variant->id,
            'quantity' => 2,
        ]);
        $this->assertDatabaseHas('inventory_movements', [
            'product_variant_id' => $variant->id,
            'quantity_change' => -2,
            'reason' => 'checkout',
        ]);
        $this->assertSame($startingStock - 2, $variant->refresh()->stock_quantity);
    }

    public function test_checkout_rejects_quantity_over_stock(): void
    {
        $this->seed();
        $variant = ProductVariant::query()->firstOrFail();

        $response = $this->postJson('/api/v1/checkout', [
            'customer' => [
                'name' => 'Nguyen Van A',
                'email' => 'a@example.com',
                'phone' => '0909009009',
                'address' => 'Quan 1, TP. Ho Chi Minh',
            ],
            'payment_method' => 'cod',
            'idempotency_key' => 'test-key-2',
            'items' => [
                ['variant_id' => $variant->id, 'quantity' => $variant->stock_quantity + 1],
            ],
        ]);

        $response->assertStatus(409);
        $this->assertDatabaseMissing('orders', ['idempotency_key' => 'test-key-2']);
    }

    public function test_authenticated_checkout_is_attached_to_member_account(): void
    {
        $this->seed();
        $user = User::factory()->create();
        $token = $user->createToken('web')->plainTextToken;
        $variant = ProductVariant::query()->firstOrFail();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/checkout', [
                'customer' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone ?? '0909009009',
                    'address' => 'Quan 1, TP. Ho Chi Minh',
                ],
                'payment_method' => 'cod',
                'idempotency_key' => 'test-key-member',
                'items' => [
                    ['variant_id' => $variant->id, 'quantity' => 1],
                ],
            ])->assertCreated();

        $this->assertDatabaseHas('orders', [
            'idempotency_key' => 'test-key-member',
            'user_id' => $user->id,
        ]);
    }

    public function test_checkout_records_promotion_usage_and_rejects_second_use_by_same_email(): void
    {
        $this->seed();
        $variant = ProductVariant::query()->firstOrFail();

        $this->postJson('/api/v1/checkout', [
            'customer' => [
                'name' => 'Nguyen Van B',
                'email' => 'promo@example.com',
                'phone' => '0909009009',
                'address' => 'Quan 1, TP. Ho Chi Minh',
            ],
            'payment_method' => 'cod',
            'promotion_code' => 'WELCOME10',
            'idempotency_key' => 'test-key-promo-1',
            'items' => [
                ['variant_id' => $variant->id, 'quantity' => 2],
            ],
        ])->assertCreated();

        $this->assertDatabaseHas('promotion_usages', [
            'email' => 'promo@example.com',
        ]);
        $this->assertSame(1, Promotion::query()->where('code', 'WELCOME10')->value('used_count'));

        $this->postJson('/api/v1/checkout', [
            'customer' => [
                'name' => 'Nguyen Van B',
                'email' => 'promo@example.com',
                'phone' => '0909009009',
                'address' => 'Quan 1, TP. Ho Chi Minh',
            ],
            'payment_method' => 'cod',
            'promotion_code' => 'WELCOME10',
            'idempotency_key' => 'test-key-promo-2',
            'items' => [
                ['variant_id' => $variant->id, 'quantity' => 2],
            ],
        ])->assertStatus(409);

        $this->assertDatabaseMissing('orders', ['idempotency_key' => 'test-key-promo-2']);
    }

    public function test_checkout_rejects_inactive_promotion(): void
    {
        $this->seed();
        $variant = ProductVariant::query()->firstOrFail();
        Promotion::query()->where('code', 'WELCOME10')->update(['active' => false]);

        $this->postJson('/api/v1/checkout', [
            'customer' => [
                'name' => 'Nguyen Van C',
                'email' => 'inactive-promo@example.com',
                'phone' => '0909009009',
                'address' => 'Quan 1, TP. Ho Chi Minh',
            ],
            'payment_method' => 'cod',
            'promotion_code' => 'WELCOME10',
            'idempotency_key' => 'test-key-inactive-promo',
            'items' => [
                ['variant_id' => $variant->id, 'quantity' => 2],
            ],
        ])->assertStatus(409);
    }
}
