<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureCustomerAccountActive;
use App\Mail\CustomerAuthOtpMail;
use App\Models\CustomerEmailOtp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Session\ArraySessionHandler;
use Illuminate\Session\Store;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class CustomerAuthApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeaders([
            'Origin' => 'http://127.0.0.1:3000',
            'Referer' => 'http://127.0.0.1:3000/',
            'Accept' => 'application/json',
        ]);
    }

    public function test_registration_allows_immediate_login_and_optional_hashed_email_verification(): void
    {
        Mail::fake();

        $csrfResponse = $this->get('/sanctum/csrf-cookie')->assertNoContent();
        $csrfSession = $csrfResponse->getCookie(config('session.cookie'))?->getValue();

        $registered = $this->postJson('/api/auth/register', [
            'name' => 'Khách CT24F',
            'email' => 'Customer@Example.com',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertCreated()
            ->assertJsonPath('data.email', 'customer@example.com')
            ->assertJsonPath('data.verification_email_sent', false);

        $user = User::query()->where('email', 'customer@example.com')->firstOrFail();
        $this->assertNull($user->email_verified_at);
        $this->assertSame(1, session('customer_auth_version'));
        $this->assertTrue(Hash::check('new-password-123', $user->password));
        $this->assertDatabaseMissing('customer_email_otps', ['email' => $user->email, 'purpose' => CustomerEmailOtp::VERIFY_EMAIL]);
        Mail::assertNothingSent();

        // Verification remains an opt-in flow and never blocks the new session.
        $this->postJson('/api/auth/email/resend', ['email' => $user->email])->assertAccepted();
        $this->assertDatabaseHas('customer_email_otps', ['email' => $user->email, 'purpose' => CustomerEmailOtp::VERIFY_EMAIL]);
        Mail::assertSent(CustomerAuthOtpMail::class, fn (CustomerAuthOtpMail $mail): bool => $mail->hasTo($user->email) && $mail->purpose === CustomerEmailOtp::VERIFY_EMAIL);

        $mail = Mail::sent(CustomerAuthOtpMail::class)->first();
        $this->assertNotNull($mail);
        $otp = CustomerEmailOtp::query()->where('email', $user->email)->firstOrFail();
        $this->assertNotSame($mail->code, $otp->otp_hash);
        $this->assertTrue(Hash::check($mail->code, $otp->otp_hash));
        $this->assertMatchesRegularExpression('/^\d{6}$/', $mail->code);

        // An unverified customer can use the normal account immediately.
        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('data.user.email_verified_at', null);
        $this->getJson('/api/account/addresses')->assertOk();

        $this->postJson('/api/auth/email/verify', ['email' => $user->email, 'code' => $mail->code])
            ->assertOk()->assertJsonPath('message', 'Email đã được xác minh. Bạn có thể đăng nhập.');
        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->postJson('/api/auth/email/verify', ['email' => $user->email, 'code' => $mail->code])->assertUnprocessable();

        $this->postJson('/api/auth/logout')->assertOk();
        $login = $this->postJson('/api/auth/login', [
            'email' => 'CUSTOMER@example.com', 'password' => 'new-password-123',
        ])->assertOk()->assertJsonPath('data.user.email', $user->email)
            ->assertJsonMissingPath('data.user.password')
            ->assertJsonMissingPath('data.user.remember_token');
        $this->assertNotEmpty($login->getCookie(config('session.cookie'))?->getValue());
        $this->postJson('/api/auth/logout')->assertOk();
    }

    public function test_duplicate_email_is_case_insensitive_and_registration_validation_is_enforced(): void
    {
        Mail::fake();
        $this->createUser('existing@example.com');

        $this->postJson('/api/auth/register', [
            'name' => 'Duplicate',
            'email' => 'Existing@Example.com',
            'password' => 'good-password',
            'password_confirmation' => 'good-password',
        ])->assertStatus(409);

        $this->postJson('/api/auth/register', [
            'name' => str_repeat('a', 151),
            'email' => 'new@example.com',
            'password' => 'short',
            'password_confirmation' => 'different',
        ])->assertUnprocessable()->assertJsonValidationErrors(['name', 'password']);
        Mail::assertNothingSent();
    }

    public function test_login_rejects_bad_blocked_and_legacy_passwordless_accounts_but_allows_unverified(): void
    {
        $verified = $this->createUser('verified@example.com');
        $blocked = $this->createUser('blocked@example.com');
        $blocked->forceFill(['blocked_at' => now()])->save();
        $this->createUser('legacy@example.com', password: null, verified: false);
        $unverified = $this->createUser('unverified@example.com', verified: false);

        $generic = $this->postJson('/api/auth/login', ['email' => 'missing@example.com', 'password' => 'wrong-password'])
            ->assertUnprocessable()->json('message');
        $this->postJson('/api/auth/login', ['email' => $verified->email, 'password' => 'wrong-password'])
            ->assertUnprocessable()->assertJsonPath('message', $generic);
        $this->postJson('/api/auth/login', ['email' => 'legacy@example.com', 'password' => 'some-password'])
            ->assertUnprocessable()->assertJsonPath('message', $generic);
        $this->postJson('/api/auth/login', ['email' => $blocked->email, 'password' => 'correct-password'])
            ->assertForbidden();
        $this->postJson('/api/auth/login', ['email' => $unverified->email, 'password' => 'correct-password'])
            ->assertOk()->assertJsonPath('data.user.email_verified_at', null);
    }

    public function test_wrong_expired_and_superseded_verification_codes_cannot_verify_an_email(): void
    {
        Mail::fake();
        $user = $this->createUser('otp@example.com', verified: false);
        $expiredCode = '123456';
        CustomerEmailOtp::query()->create([
            'user_id' => $user->id, 'email' => $user->email, 'purpose' => CustomerEmailOtp::VERIFY_EMAIL,
            'otp_hash' => Hash::make($expiredCode), 'expires_at' => now()->subSecond(), 'last_sent_at' => now()->subMinute(),
        ]);
        $this->postJson('/api/auth/email/verify', ['email' => $user->email, 'code' => $expiredCode])->assertUnprocessable();
        $this->assertNull($user->fresh()->email_verified_at);

        $oldCode = '654321';
        CustomerEmailOtp::query()->create([
            'user_id' => $user->id, 'email' => $user->email, 'purpose' => CustomerEmailOtp::VERIFY_EMAIL,
            'otp_hash' => Hash::make($oldCode), 'expires_at' => now()->addMinutes(5), 'last_sent_at' => now()->subSeconds(61),
        ]);
        $this->postJson('/api/auth/email/resend', ['email' => $user->email])->assertAccepted();
        $newMail = Mail::sent(CustomerAuthOtpMail::class)->last();
        $this->assertNotSame($oldCode, $newMail->code);

        $this->postJson('/api/auth/email/verify', ['email' => $user->email, 'code' => $oldCode])->assertUnprocessable();
        $this->postJson('/api/auth/email/verify', ['email' => $user->email, 'code' => $newMail->code])->assertOk();
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_five_wrong_code_attempts_consume_the_otp_and_correct_code_is_rejected(): void
    {
        $user = $this->createUser('attempts@example.com', verified: false);
        $code = '246810';
        $otp = CustomerEmailOtp::query()->create([
            'user_id' => $user->id, 'email' => $user->email, 'purpose' => CustomerEmailOtp::VERIFY_EMAIL,
            'otp_hash' => Hash::make($code), 'expires_at' => now()->addMinutes(5), 'last_sent_at' => now(),
        ]);

        foreach (range(1, 5) as $attempt) {
            $this->postJson('/api/auth/email/verify', ['email' => $user->email, 'code' => '000000'])->assertUnprocessable();
        }

        $this->assertSame(5, $otp->fresh()->failed_attempts);
        $this->assertNotNull($otp->fresh()->consumed_at);
        $this->postJson('/api/auth/email/verify', ['email' => $user->email, 'code' => $code])->assertUnprocessable();
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_forgot_password_does_not_enumerate_and_only_sends_to_eligible_users(): void
    {
        Mail::fake();
        $eligible = $this->createUser('eligible@example.com', verified: false);
        $blocked = $this->createUser('blocked-reset@example.com');
        $blocked->forceFill(['blocked_at' => now()])->save();

        $existing = $this->postJson('/api/auth/forgot-password', ['email' => $eligible->email])->assertAccepted();
        $unknown = $this->postJson('/api/auth/forgot-password', ['email' => 'unknown@example.com'])->assertAccepted();
        $blockedResponse = $this->postJson('/api/auth/forgot-password', ['email' => $blocked->email])->assertAccepted();
        $this->assertSame($existing->json(), $unknown->json());
        $this->assertSame($existing->json(), $blockedResponse->json());
        Mail::assertSent(CustomerAuthOtpMail::class, fn (CustomerAuthOtpMail $mail): bool => $mail->hasTo($eligible->email) && $mail->purpose === CustomerEmailOtp::RESET_PASSWORD);
        Mail::assertSent(CustomerAuthOtpMail::class, 1);
    }

    public function test_reset_code_changes_password_once_invalidates_sessions_and_cannot_be_cross_used(): void
    {
        $user = $this->createUser('reset@example.com', verified: false);
        $this->withSession(['customer_auth_version' => 1])->actingAs($user);
        $this->getJson('/api/auth/me')->assertOk();
        $verifyCode = '112233';
        CustomerEmailOtp::query()->create([
            'user_id' => $user->id, 'email' => $user->email, 'purpose' => CustomerEmailOtp::VERIFY_EMAIL,
            'otp_hash' => Hash::make($verifyCode), 'expires_at' => now()->addMinutes(5), 'last_sent_at' => now(),
        ]);

        $this->postJson('/api/auth/forgot-password/reset', [
            'email' => $user->email, 'code' => $verifyCode,
            'password' => 'new-password-456', 'password_confirmation' => 'new-password-456',
        ])->assertUnprocessable();

        $resetCode = '998877';
        $resetOtp = CustomerEmailOtp::query()->create([
            'user_id' => $user->id, 'email' => $user->email, 'purpose' => CustomerEmailOtp::RESET_PASSWORD,
            'otp_hash' => Hash::make($resetCode), 'expires_at' => now()->addMinutes(5), 'last_sent_at' => now(),
        ]);
        $this->postJson('/api/auth/forgot-password/reset', [
            'email' => $user->email, 'code' => $resetCode,
            'password' => 'new-password-456', 'password_confirmation' => 'new-password-456',
        ])->assertOk();

        $this->assertTrue(Hash::check('new-password-456', $user->fresh()->password));
        $this->assertSame(2, $user->fresh()->customer_auth_version);
        $this->assertNotNull($resetOtp->fresh()->consumed_at);
        $this->postJson('/api/auth/forgot-password/reset', [
            'email' => $user->email, 'code' => $resetCode,
            'password' => 'another-new-password', 'password_confirmation' => 'another-new-password',
        ])->assertUnprocessable();
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'correct-password'])->assertUnprocessable();
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'new-password-456'])->assertOk();
    }

    public function test_blocked_accounts_cannot_reset_or_verify_and_otp_sends_are_rate_limited(): void
    {
        Mail::fake();
        $user = $this->createUser('blocked-otp@example.com', verified: false);
        $user->forceFill(['blocked_at' => now()])->save();
        $this->postJson('/api/auth/email/resend', ['email' => $user->email])->assertAccepted();
        $this->postJson('/api/auth/forgot-password', ['email' => $user->email])->assertAccepted();
        Mail::assertNothingSent();

        $validUser = $this->createUser('rate@example.com', verified: false);
        $this->postJson('/api/auth/email/resend', ['email' => $validUser->email])->assertAccepted();
        foreach (range(1, 10) as $attempt) {
            $this->postJson('/api/auth/email/verify', ['email' => $validUser->email, 'code' => '000000'])->assertUnprocessable();
        }
        $this->postJson('/api/auth/email/verify', ['email' => $validUser->email, 'code' => '000000'])->assertStatus(429);
    }

    public function test_password_reset_version_change_rejects_an_existing_customer_session(): void
    {
        $user = $this->createUser('session-revoked@example.com');
        $session = new Store('customer-test', new ArraySessionHandler(120));
        $session->start();
        $session->put('customer_auth_version', (int) $user->customer_auth_version);
        $request = Request::create('/api/auth/me');
        $request->setUserResolver(fn (): User => $user);
        $request->setLaravelSession($session);
        $middleware = new EnsureCustomerAccountActive;
        $next = fn () => response()->json(['ok' => true]);

        $this->assertSame(200, $middleware->handle($request, $next)->getStatusCode());
        $user->forceFill(['customer_auth_version' => $user->customer_auth_version + 1])->save();
        $this->assertSame(401, $middleware->handle($request, $next)->getStatusCode());
    }

    public function test_csrf_stateful_cookie_and_cors_credentials_are_configured(): void
    {
        $response = $this->get('/sanctum/csrf-cookie')->assertNoContent();
        $cookieNames = collect($response->headers->getCookies())->map(fn ($cookie) => $cookie->getName())->all();
        $this->assertContains('XSRF-TOKEN', $cookieNames);
        $this->assertContains(config('session.cookie'), $cookieNames);
        $this->assertTrue(config('cors.supports_credentials'));
        $this->assertContains('127.0.0.1:3000', config('sanctum.stateful'));
    }

    private function createUser(string $email, ?string $password = 'correct-password', bool $verified = true): User
    {
        $user = User::query()->create([
            'name' => 'Customer',
            'email' => $email,
            'password' => $password === null ? null : Hash::make($password),
        ]);
        if ($verified) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        return $user->fresh();
    }
}
