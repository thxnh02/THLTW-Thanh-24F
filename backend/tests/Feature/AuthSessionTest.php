<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_logout_invalidates_session_authentication(): void
    {
        $user = User::factory()->create([
            'email' => 'logout@example.com',
            'password' => 'Password@123',
        ]);

        $this->withHeader('Origin', 'http://localhost:3000')->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'Password@123',
        ])->assertOk();

        $this->withHeader('Origin', 'http://localhost:3000')->getJson('/api/v1/auth/me')->assertOk();
        $this->withHeader('Origin', 'http://localhost:3000')->postJson('/api/v1/auth/logout')->assertOk();
        $this->assertGuest('web');
    }

    public function test_password_reset_email_uses_frontend_url(): void
    {
        config(['app.frontend_url' => 'http://localhost:3000']);
        Notification::fake();
        $user = User::factory()->create(['email' => 'reset@example.com']);

        $this->postJson('/api/v1/auth/forgot-password', [
            'email' => $user->email,
        ])->assertOk();

        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user): bool {
            $url = $notification->toMail($user)->actionUrl;

            return str_contains($url, 'http://localhost:3000/reset-password')
                && str_contains($url, 'email=reset%40example.com');
        });
    }
}
