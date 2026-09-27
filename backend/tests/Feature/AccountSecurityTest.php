<?php

namespace Tests\Feature;

use App\Mail\PasswordResetOtpMail;
use App\Models\EmailVerificationCode;
use App\Models\PasswordResetOtp;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
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
        NotificationFacade::assertSentTo($user, VerifyEmailNotification::class);
        $this->assertNull($user->email_verified_at);
    }

    public function test_verification_email_uses_shop_name_and_a_signed_link(): void
    {
        NotificationFacade::fake();
        Setting::query()->create(['key' => 'website_name', 'value' => 'Thanh Tech Shop', 'type' => 'string']);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Email Member',
            'email' => 'email-member@example.com',
            'password' => 'Password@123',
            'password_confirmation' => 'Password@123',
        ])->assertCreated();

        $user = User::query()->where('email', 'email-member@example.com')->firstOrFail();
        NotificationFacade::assertSentTo($user, VerifyEmailNotification::class, function (VerifyEmailNotification $notification) use ($user): bool {
            $mail = $notification->toMail($user);

            return $mail->subject === 'Xác nhận email - Thanh Tech Shop'
                && $mail->actionText === 'Xác nhận email'
                && str_contains((string) $mail->actionUrl, '/api/v1/auth/email/verify/'.$user->id.'/')
                && str_contains((string) $mail->actionUrl, 'signature=');
        });
    }

    public function test_email_verification_code_can_verify_the_current_user_once(): void
    {
        $user = User::factory()->unverified()->create();
        EmailVerificationCode::create([
            'user_id' => $user->id,
            'code_hash' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(15),
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/auth/email/verify-code', ['code' => '000000'])
            ->assertUnprocessable();

        $this->postJson('/api/v1/auth/email/verify-code', ['code' => '123456'])
            ->assertOk()
            ->assertJsonPath('data.email_verified_at', fn ($value): bool => $value !== null);

        $this->assertNotNull($user->refresh()->email_verified_at);
        $this->assertNotNull(EmailVerificationCode::query()->firstOrFail()->refresh()->used_at);

        $this->postJson('/api/v1/auth/email/verify-code', ['code' => '123456'])
            ->assertOk();
    }

    public function test_forgot_password_sends_a_hashed_otp_email(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'otp@example.com']);

        $this->postJson('/api/v1/auth/forgot-password/otp', ['email' => $user->email])
            ->assertOk()
            ->assertJsonPath('success', true);

        $otp = PasswordResetOtp::query()->where('user_id', $user->id)->latest('id')->firstOrFail();
        $this->assertNotSame('123456', $otp->code_hash);
        $this->assertTrue($otp->expires_at->isFuture());
        Mail::assertSent(PasswordResetOtpMail::class, fn (PasswordResetOtpMail $mail): bool => $mail->hasTo($user->email));
    }

    public function test_otp_can_reset_password_once_and_resend_replaces_old_otp(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'otp-reset@example.com', 'password' => 'OldPassword@123']);
        $oldOtp = PasswordResetOtp::create([
            'user_id' => $user->id,
            'code_hash' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(10),
        ]);

        $this->postJson('/api/v1/auth/forgot-password/otp/resend', ['email' => $user->email])->assertOk();
        $this->assertNotNull($oldOtp->refresh()->used_at);
        $newOtp = PasswordResetOtp::query()->where('user_id', $user->id)->whereNull('used_at')->latest('id')->firstOrFail();

        $this->postJson('/api/v1/auth/reset-password/otp', [
            'email' => $user->email,
            'token' => '123456',
            'password' => 'NewPassword@123',
            'password_confirmation' => 'NewPassword@123',
        ])->assertUnprocessable();

        $code = '654321';
        $newOtp->update(['code_hash' => Hash::make($code)]);
        $this->postJson('/api/v1/auth/reset-password/otp', [
            'email' => $user->email,
            'token' => $code,
            'password' => 'NewPassword@123',
            'password_confirmation' => 'NewPassword@123',
        ])->assertOk();

        $this->assertTrue(Hash::check('NewPassword@123', $user->refresh()->password));
        $this->assertNotNull($newOtp->refresh()->used_at);
        $this->postJson('/api/v1/auth/reset-password/otp', [
            'email' => $user->email,
            'token' => $code,
            'password' => 'AnotherPassword@123',
            'password_confirmation' => 'AnotherPassword@123',
        ])->assertUnprocessable();
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
        NotificationFacade::assertSentTo($user, VerifyEmailNotification::class);
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

    public function test_logged_out_verification_redirects_to_login_without_verifying(): void
    {
        $user = User::factory()->unverified()->create();
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(10), [
            'id' => $user->id,
            'hash' => sha1($user->getEmailForVerification()),
        ]);

        $response = $this->get($url)->assertRedirect();

        $this->assertStringStartsWith('http://localhost:3000/login?verification_url=', $response->headers->get('Location'));
        $this->assertNull($user->refresh()->email_verified_at);
    }

    public function test_signed_email_verification_rejects_a_different_authenticated_user(): void
    {
        $user = User::factory()->unverified()->create();
        $other = User::factory()->unverified()->create();
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(10), [
            'id' => $user->id,
            'hash' => sha1($user->getEmailForVerification()),
        ]);

        Sanctum::actingAs($other);

        $this->get($url)->assertForbidden();
        $this->assertNull($user->refresh()->email_verified_at);
    }

    private function validPng(): string
    {
        return base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');
    }
}
