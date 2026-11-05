<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\AdminExampleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeaders(['Origin' => 'http://127.0.0.1:3000', 'Accept' => 'application/json']);
    }

    public function test_anonymous_requests_cannot_read_or_modify_admin_data(): void
    {
        $this->getJson('/api/admin/categories')->assertUnauthorized();
        $this->postJson('/api/admin/categories', ['name' => 'Forbidden', 'slug' => 'forbidden'])->assertUnauthorized();
        $category = \App\Models\Category::create(['name' => 'Protected', 'slug' => 'protected', 'status' => true]);
        $this->deleteJson('/api/admin/categories/'.$category->id)->assertUnauthorized();
    }

    public function test_customer_login_does_not_grant_admin_access(): void
    {
        $customer = $this->user('customer@example.test');
        $this->postJson('/api/admin/login', ['email' => $customer->email, 'password' => 'example-password'])->assertUnprocessable();
        $this->postJson('/api/auth/login', ['email' => $customer->email, 'password' => 'example-password'])->assertOk();
        $this->getJson('/api/admin/categories')->assertUnauthorized();
        $this->postJson('/api/admin/products', [])->assertUnauthorized();
    }

    public function test_payment_diagnostics_do_not_consume_admin_login_rate_limit(): void
    {
        $admin = $this->user('rate-admin@example.test', true);
        for ($i = 0; $i < 10; $i++) {
            $this->getJson('/api/payments/vnpay/ipn')->assertOk();
        }
        $this->postJson('/api/admin/login', ['email' => $admin->email, 'password' => 'example-password'])->assertOk();
    }

    public function test_public_registration_cannot_assign_admin_role(): void
    {
        Mail::fake();
        $this->postJson('/api/auth/register', [
            'name' => 'Registrant', 'email' => 'registrant@example.test',
            'password' => 'example-password', 'password_confirmation' => 'example-password',
            'is_admin' => true,
        ])->assertCreated();

        $this->assertFalse(User::query()->where('email', 'registrant@example.test')->firstOrFail()->is_admin);
    }

    public function test_admin_login_allows_admin_routes_and_logout_revokes_session(): void
    {
        $admin = $this->user('admin@example.test', true);
        $this->postJson('/api/admin/login', ['email' => $admin->email, 'password' => 'wrong'])->assertUnprocessable();
        $login = $this->postJson('/api/admin/login', ['email' => $admin->email, 'password' => 'example-password'])
            ->assertOk()->assertJsonPath('data.user.email', $admin->email)->assertJsonMissingPath('data.user.password');
        $this->useAdminCookie($login);
        $this->getJson('/api/admin/me')->assertOk()->assertJsonPath('data.user.id', $admin->id);
        $this->getJson('/api/admin/categories')->assertOk();
        $this->postJson('/api/admin/logout')->assertOk();
        $this->getJson('/api/admin/categories')->assertUnauthorized();
    }

    public function test_explicit_local_example_seeder_and_independent_real_admin_both_use_normal_login(): void
    {
        config()->set('admin_example.email', 'seeded-admin@example.test');
        config()->set('admin_example.password', 'synthetic-seed-password-123');
        $this->seed(AdminExampleSeeder::class);
        $seeded = User::query()->where('email', 'seeded-admin@example.test')->firstOrFail();
        $this->assertTrue($seeded->is_admin);
        $login = $this->postJson('/api/admin/login', ['email' => $seeded->email, 'password' => 'synthetic-seed-password-123'])->assertOk();
        $this->useAdminCookie($login);
        $this->postJson('/api/admin/logout')->assertOk();
        $real = $this->user('independent-admin@example.test', true);
        $this->postJson('/api/admin/login', ['email' => $real->email, 'password' => 'example-password'])
            ->assertOk()->assertJsonPath('data.user.id', $real->id);
    }

    public function test_blocked_or_invalidated_admin_session_cannot_access_admin_routes(): void
    {
        $admin = $this->user('blocked-admin@example.test', true);
        $admin->forceFill(['blocked_at' => now()])->save();
        $this->postJson('/api/admin/login', ['email' => $admin->email, 'password' => 'example-password'])->assertUnprocessable();
        $admin->forceFill(['blocked_at' => null])->save();
        $login = $this->postJson('/api/admin/login', ['email' => $admin->email, 'password' => 'example-password'])->assertOk();
        $this->useAdminCookie($login);
        $admin->forceFill(['customer_auth_version' => 2])->save();
        $this->getJson('/api/admin/categories')->assertUnauthorized();
    }

    public function test_removed_admin_role_takes_effect_on_the_next_request(): void
    {
        $admin = $this->user('role-revoked@example.test', true);
        $login = $this->postJson('/api/admin/login', ['email' => $admin->email, 'password' => 'example-password'])->assertOk();
        $this->useAdminCookie($login);
        $admin->forceFill(['is_admin' => false])->save();
        $this->getJson('/api/admin/categories')->assertForbidden();
    }

    public function test_admin_cannot_block_an_admin_account_through_customer_management(): void
    {
        $admin = $this->user('first-admin@example.test', true);
        $target = $this->user('second-admin@example.test', true);
        $login = $this->postJson('/api/admin/login', ['email' => $admin->email, 'password' => 'example-password'])->assertOk();
        $this->useAdminCookie($login);
        $this->getJson('/api/admin/users')->assertOk()->assertJsonMissing(['email' => $target->email]);
        $this->getJson("/api/admin/users/{$target->id}")->assertNotFound();
        $this->patchJson("/api/admin/users/{$target->id}/block")->assertForbidden();
        $this->assertNull($target->fresh()->blocked_at);
    }

    private function useAdminCookie(\Illuminate\Testing\TestResponse $response): void
    {
        $this->withCredentials()->withCookie('ct24f_admin_auth', $response->getCookie('ct24f_admin_auth')->getValue());
    }

    private function user(string $email, bool $admin = false): User
    {
        $user = User::query()->create(['name' => 'Example', 'email' => $email, 'password' => Hash::make('example-password')]);
        $user->forceFill(['email_verified_at' => now(), 'is_admin' => $admin])->save();

        return $user->fresh();
    }
}
