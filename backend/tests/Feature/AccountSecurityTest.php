<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_sends_email_verification_notification(): void
    {
        NotificationFacade::fake();

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Verified Member',
            'email' => 'verified@example.com',
            'password' => 'Password@123',
            'password_confirmation' => 'Password@123',
        ])->assertCreated();

        $user = User::query()->where('email', 'verified@example.com')->firstOrFail();
        NotificationFacade::assertSentTo($user, VerifyEmail::class);
        $this->assertNull($user->email_verified_at);
    }

    public function test_avatar_can_be_replaced_and_removed_only_for_current_user(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $other = User::factory()->create();
        Sanctum::actingAs($user);

        $first = $this->postJson('/api/v1/account/avatar', [
            'avatar' => UploadedFile::fake()->createWithContent('first.png', $this->validPng()),
        ])->assertOk()->json('data.avatar_path');

        Storage::disk('public')->assertExists($first);

        $second = $this->postJson('/api/v1/account/avatar', [
            'avatar' => UploadedFile::fake()->createWithContent('second.png', $this->validPng()),
        ])->assertOk()->json('data.avatar_path');

        Storage::disk('public')->assertMissing($first);
        Storage::disk('public')->assertExists($second);

        $this->deleteJson('/api/v1/account/avatar')->assertOk();
        Storage::disk('public')->assertMissing($second);

        $this->actingAs($other);
        $this->deleteJson('/api/v1/account/avatar')->assertOk();
    }

    public function test_avatar_rejects_invalid_mime_and_oversized_files(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/account/avatar', [
            'avatar' => UploadedFile::fake()->create('avatar.txt', 10, 'text/plain'),
        ])->assertUnprocessable();

        $this->postJson('/api/v1/account/avatar', [
            'avatar' => UploadedFile::fake()->create('avatar.jpg', 2049, 'image/jpeg'),
        ])->assertUnprocessable();
    }

    public function test_email_change_requires_password_and_resets_verification(): void
    {
        NotificationFacade::fake();
        $user = User::factory()->create([
            'email' => 'old@example.com',
            'password' => 'Password@123',
            'email_verified_at' => now(),
        ]);
        Sanctum::actingAs($user);

        $this->patchJson('/api/v1/account/email', [
            'email' => 'new@example.com',
            'current_password' => 'wrong-password',
        ])->assertUnprocessable();

        $this->patchJson('/api/v1/account/email', [
            'email' => 'new@example.com',
            'current_password' => 'Password@123',
        ])->assertOk()->assertJsonPath('data.email', 'new@example.com');

        $user->refresh();
        $this->assertNull($user->email_verified_at);
        NotificationFacade::assertSentTo($user, VerifyEmail::class);
    }

    public function test_signed_email_verification_requires_valid_signature(): void
    {
        $user = User::factory()->unverified()->create();
        Sanctum::actingAs($user);

        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(10), [
            'id' => $user->id,
            'hash' => sha1($user->getEmailForVerification()),
        ]);

        $this->get($url)->assertRedirect('http://localhost:3000/account/verify-email?status=success');
        $this->assertNotNull($user->refresh()->email_verified_at);

        $another = User::factory()->unverified()->create();
        Sanctum::actingAs($another);
        $this->get('/api/v1/auth/email/verify/'.$another->id.'/invalid')->assertForbidden();
    }

    private function validPng(): string
    {
        return base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');
    }
}
