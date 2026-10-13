<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_admin_dashboard(): void
    {
        $this->getJson('/api/v1/admin/dashboard')->assertUnauthorized();
    }

    public function test_member_cannot_access_admin_dashboard(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/admin/dashboard')->assertForbidden();
    }

    public function test_admin_can_access_admin_dashboard(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['total_orders', 'total_members', 'total_products']]);
    }
}
