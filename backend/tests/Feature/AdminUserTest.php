<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminUserTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_update_search_and_delete_user(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $userId = $this->postJson('/api/v1/admin/users', [
            'name' => 'Member Managed',
            'email' => 'managed@example.com',
            'phone' => '0909009009',
            'password' => 'Password@123',
            'role' => 'member',
            'status' => 'active',
        ])->assertCreated()
            ->assertJsonPath('data.email', 'managed@example.com')
            ->json('data.id');

        $this->assertTrue(Hash::check('Password@123', User::query()->findOrFail($userId)->password));

        $this->getJson('/api/v1/admin/users?q=managed')
            ->assertOk()
            ->assertJsonPath('data.data.0.email', 'managed@example.com');

        $this->patchJson('/api/v1/admin/users/'.$userId, [
            'name' => 'Member Locked',
            'email' => 'managed@example.com',
            'phone' => '0909009000',
            'role' => 'member',
            'status' => 'locked',
        ])->assertOk()
            ->assertJsonPath('data.status', 'locked');

        $this->postJson('/api/v1/auth/login', [
            'email' => 'managed@example.com',
            'password' => 'Password@123',
        ])->assertForbidden();

        $this->deleteJson('/api/v1/admin/users/'.$userId)->assertOk();
        $this->assertSoftDeleted('users', ['id' => $userId]);
    }

    public function test_admin_cannot_lock_demote_or_delete_self(): void
    {
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        $this->patchJson('/api/v1/admin/users/'.$admin->id, [
            'name' => $admin->name,
            'email' => $admin->email,
            'phone' => $admin->phone,
            'role' => 'member',
            'status' => 'active',
        ])->assertStatus(409);

        $this->patchJson('/api/v1/admin/users/'.$admin->id, [
            'name' => $admin->name,
            'email' => $admin->email,
            'phone' => $admin->phone,
            'role' => 'admin',
            'status' => 'locked',
        ])->assertStatus(409);

        $this->deleteJson('/api/v1/admin/users/'.$admin->id)->assertStatus(409);
    }
}
