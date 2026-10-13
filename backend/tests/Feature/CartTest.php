<?php

namespace Tests\Feature;

use App\Models\CartItem;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_add_update_and_remove_cart_item(): void
    {
        $this->seed();
        Sanctum::actingAs(User::factory()->create());
        $variant = ProductVariant::query()->firstOrFail();

        $add = $this->postJson('/api/v1/cart/items', [
            'variant_id' => $variant->id,
            'quantity' => 2,
        ]);

        $itemId = $add
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->json('data.items.0.id');

        $this->assertDatabaseHas('cart_items', [
            'id' => $itemId,
            'product_variant_id' => $variant->id,
            'quantity' => 2,
        ]);

        $this->patchJson('/api/v1/cart/items/'.$itemId, ['quantity' => 3])
            ->assertOk()
            ->assertJsonPath('data.items.0.quantity', 3);

        $this->deleteJson('/api/v1/cart/items/'.$itemId)
            ->assertOk()
            ->assertJsonPath('data.items', []);
    }

    public function test_member_cart_merge_adds_guest_quantities_without_exceeding_stock(): void
    {
        $this->seed();
        Sanctum::actingAs(User::factory()->create());
        $variant = ProductVariant::query()->firstOrFail();

        $this->postJson('/api/v1/cart/items', [
            'variant_id' => $variant->id,
            'quantity' => 2,
        ])->assertCreated();

        $this->postJson('/api/v1/cart/merge', [
            'items' => [
                ['variant_id' => $variant->id, 'quantity' => $variant->stock_quantity],
            ],
        ])->assertOk();

        $this->assertSame(
            $variant->stock_quantity,
            CartItem::query()->where('product_variant_id', $variant->id)->firstOrFail()->quantity,
        );
    }

    public function test_member_cannot_set_cart_quantity_over_stock(): void
    {
        $this->seed();
        Sanctum::actingAs(User::factory()->create());
        $variant = ProductVariant::query()->firstOrFail();

        $itemId = $this->postJson('/api/v1/cart/items', [
            'variant_id' => $variant->id,
            'quantity' => 1,
        ])->assertCreated()->json('data.items.0.id');

        $this->patchJson('/api/v1/cart/items/'.$itemId, [
            'quantity' => $variant->stock_quantity + 1,
        ])->assertStatus(409);
    }
}
