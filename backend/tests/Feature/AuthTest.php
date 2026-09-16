<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_register_and_receive_token(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Tran Van B',
            'email' => 'member-new@example.com',
            'phone' => '0911222333',
            'password' => 'Password@123',
            'password_confirmation' => 'Password@123',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['token', 'token_type', 'user' => ['id', 'name', 'email', 'role', 'status']]]);

        $this->assertDatabaseHas('users', [
            'email' => 'member-new@example.com',
            'role' => 'member',
            'status' => 'active',
        ]);
    }

    public function test_member_can_login_and_fetch_profile(): void
    {
        User::factory()->create([
            'email' => 'login@example.com',
            'password' => 'Password@123',
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'login@example.com',
            'password' => 'Password@123',
        ]);

        $token = $login->assertOk()->json('data.token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'login@example.com');
    }

    public function test_locked_member_cannot_login(): void
    {
        User::factory()->locked()->create([
            'email' => 'locked@example.com',
            'password' => 'Password@123',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'locked@example.com',
            'password' => 'Password@123',
        ])->assertForbidden();
    }
}
