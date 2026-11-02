<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerAccountResource;
use App\Models\CustomerEmailOtp;
use App\Models\User;
use App\Services\CustomerAuthOtpService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class CustomerAuthController extends Controller
{
    private const DUMMY_PASSWORD_HASH = '$2y$12$WZ6qid8j2VTVkIDUiLP4J./3wFanpBT5wx/sbw.02b2bB6Dix6ztO';

    private const GENERIC_OTP_MESSAGE = 'Nếu email thuộc tài khoản phù hợp, hướng dẫn sẽ được gửi khi dịch vụ email sẵn sàng.';

    public function register(Request $request, CustomerAuthOtpService $otpService): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'string', 'email:rfc', 'max:254'],
            'password' => ['required', 'string', Password::min(8)->max(128), 'confirmed'],
        ]);

        $email = $this->normalizeEmail($validated['email']);
        if ($this->findUser($email) !== null) {
            return response()->json(['message' => 'Email này đã được đăng ký. Hãy đăng nhập hoặc gửi lại mã xác minh.'], 409);
        }

        try {
            $user = User::query()->create([
                'name' => trim($validated['name']),
                'email' => $email,
                'password' => Hash::make($validated['password']),
            ]);
        } catch (QueryException) {
            if ($this->findUser($email) !== null) {
                return response()->json(['message' => 'Email này đã được đăng ký. Hãy đăng nhập hoặc gửi lại mã xác minh.'], 409);
            }

            throw new \RuntimeException('Customer account creation failed.');
        }

        $delivery = $otpService->issue($user, CustomerEmailOtp::VERIFY_EMAIL);
        $message = $delivery === 'sent'
            ? 'Tạo tài khoản thành công. Hãy nhập mã đã gửi để xác minh email.'
            : 'Tài khoản đã được tạo nhưng chưa gửi được mã. Hãy thử gửi lại mã xác minh.';

        return response()->json([
            'message' => $message,
            'data' => [
                'email' => $user->email,
                'verification_email_sent' => $delivery === 'sent',
            ],
        ], 201);
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email:rfc', 'max:254'],
            'code' => ['required', 'digits:6'],
        ]);

        $email = $this->normalizeEmail($validated['email']);
        if ($this->hitCodeAttemptLimit($request, $email)) {
            return $this->tooManyAttempts();
        }

        $result = $this->consumeOtp($email, CustomerEmailOtp::VERIFY_EMAIL, $validated['code'], function (User $user): void {
            if ($user->email_verified_at === null) {
                $user->forceFill(['email_verified_at' => now()])->save();
            }
        });

        if ($result === 'blocked') {
            return response()->json(['message' => 'Tài khoản hiện không thể sử dụng.'], 403);
        }
        if ($result !== 'valid') {
            return response()->json(['message' => 'Mã xác minh không hợp lệ, đã hết hạn hoặc đã được sử dụng.'], 422);
        }

        return response()->json(['message' => 'Email đã được xác minh. Bạn có thể đăng nhập.']);
    }

    public function resendVerification(Request $request, CustomerAuthOtpService $otpService): JsonResponse
    {
        $validated = $request->validate(['email' => ['required', 'string', 'email:rfc', 'max:254']]);
        $email = $this->normalizeEmail($validated['email']);
        if ($this->hitOtpSendLimit($request, $email)) {
            return $this->tooManyAttempts();
        }

        $user = $this->findUser($email);
        if ($user !== null && $user->blocked_at === null && $user->email_verified_at === null) {
            $otpService->issue($user, CustomerEmailOtp::VERIFY_EMAIL);
        }

        return response()->json(['message' => self::GENERIC_OTP_MESSAGE], 202);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email:rfc', 'max:254'],
            'password' => ['required', 'string', 'max:128'],
        ]);

        $email = $this->normalizeEmail($validated['email']);
        $limitKey = 'customer-login:'.hash('sha256', $email.'|'.$request->ip());
        if (RateLimiter::tooManyAttempts($limitKey, 5)) {
            return $this->tooManyAttempts();
        }
        RateLimiter::hit($limitKey, 60);

        $user = $this->findUser($email);
        $passwordHash = $user?->password ?: self::DUMMY_PASSWORD_HASH;
        $passwordMatches = Hash::check($validated['password'], $passwordHash);

        if ($user === null || $user->password === null || ! $passwordMatches) {
            return response()->json(['message' => 'Email hoặc mật khẩu không chính xác.'], 422);
        }
        if ($user->blocked_at !== null) {
            return response()->json(['message' => 'Tài khoản hiện không thể đăng nhập.'], 403);
        }
        if ($user->email_verified_at === null) {
            return response()->json([
                'message' => 'Email chưa được xác minh. Hãy nhập mã hoặc yêu cầu gửi lại mã.',
                'code' => 'EMAIL_NOT_VERIFIED',
                'data' => ['email' => $user->email],
            ], 403);
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $request->session()->put('customer_auth_version', (int) $user->customer_auth_version);
        RateLimiter::clear($limitKey);

        return response()->json([
            'message' => 'Đăng nhập thành công.',
            'data' => ['user' => CustomerAccountResource::make($user)],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => ['user' => CustomerAccountResource::make($request->user())]]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Bạn đã đăng xuất.']);
    }

    public function forgotPassword(Request $request, CustomerAuthOtpService $otpService): JsonResponse
    {
        $validated = $request->validate(['email' => ['required', 'string', 'email:rfc', 'max:254']]);
        $email = $this->normalizeEmail($validated['email']);
        if ($this->hitOtpSendLimit($request, $email)) {
            return $this->tooManyAttempts();
        }

        $user = $this->findUser($email);
        if ($user !== null && $user->blocked_at === null) {
            $otpService->issue($user, CustomerEmailOtp::RESET_PASSWORD);
        }

        return response()->json(['message' => self::GENERIC_OTP_MESSAGE], 202);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email:rfc', 'max:254'],
            'code' => ['required', 'digits:6'],
            'password' => ['required', 'string', Password::min(8)->max(128), 'confirmed'],
        ]);

        $email = $this->normalizeEmail($validated['email']);
        if ($this->hitCodeAttemptLimit($request, $email)) {
            return $this->tooManyAttempts();
        }

        $result = $this->consumeOtp($email, CustomerEmailOtp::RESET_PASSWORD, $validated['code'], function (User $user) use ($validated): void {
            $user->forceFill([
                'password' => Hash::make($validated['password']),
                'remember_token' => Str::random(60),
                'customer_auth_version' => (int) $user->customer_auth_version + 1,
            ])->save();

            CustomerEmailOtp::query()
                ->where('email', $user->email)
                ->where('purpose', CustomerEmailOtp::RESET_PASSWORD)
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now()]);
        });

        if ($result === 'blocked') {
            return response()->json(['message' => 'Tài khoản hiện không thể sử dụng.'], 403);
        }
        if ($result !== 'valid') {
            return response()->json(['message' => 'Mã không hợp lệ, đã hết hạn hoặc đã được sử dụng.'], 422);
        }

        return response()->json(['message' => 'Mật khẩu đã được cập nhật. Bạn có thể đăng nhập.']);
    }

    /** @param callable(User): void $onValid */
    private function consumeOtp(string $email, string $purpose, string $code, callable $onValid): string
    {
        return DB::transaction(function () use ($email, $purpose, $code, $onValid): string {
            $user = $this->findUser($email, lock: true);
            if ($user === null) {
                return 'invalid';
            }
            if ($user->blocked_at !== null) {
                return 'blocked';
            }

            $otp = CustomerEmailOtp::query()
                ->where('user_id', $user->id)
                ->where('email', $user->email)
                ->where('purpose', $purpose)
                ->whereNull('consumed_at')
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();

            if ($otp === null) {
                return 'invalid';
            }
            if ($otp->expires_at->isPast() || $otp->failed_attempts >= 5) {
                $otp->forceFill(['consumed_at' => now()])->save();

                return 'invalid';
            }
            if (! Hash::check($code, $otp->otp_hash)) {
                $attempts = $otp->failed_attempts + 1;
                $otp->forceFill([
                    'failed_attempts' => $attempts,
                    'consumed_at' => $attempts >= 5 ? now() : null,
                ])->save();

                return 'invalid';
            }

            $onValid($user);
            $otp->forceFill(['consumed_at' => now()])->save();

            return 'valid';
        });
    }

    private function hitOtpSendLimit(Request $request, string $email): bool
    {
        return $this->hitSharedLimit($request, $email, 'customer-otp-send', emailLimit: 5, ipLimit: 20, decay: 3600);
    }

    private function hitCodeAttemptLimit(Request $request, string $email): bool
    {
        return $this->hitSharedLimit($request, $email, 'customer-otp-check', emailLimit: 10, ipLimit: 30, decay: 3600);
    }

    private function hitSharedLimit(Request $request, string $email, string $prefix, int $emailLimit, int $ipLimit, int $decay): bool
    {
        $emailKey = $prefix.':email:'.hash('sha256', $email);
        $ipKey = $prefix.':ip:'.hash('sha256', (string) $request->ip());
        $pairKey = $prefix.':pair:'.hash('sha256', $email.'|'.$request->ip());
        if (RateLimiter::tooManyAttempts($emailKey, $emailLimit)
            || RateLimiter::tooManyAttempts($ipKey, $ipLimit)
            || RateLimiter::tooManyAttempts($pairKey, min($emailLimit, $ipLimit))) {
            return true;
        }

        RateLimiter::hit($emailKey, $decay);
        RateLimiter::hit($ipKey, $decay);
        RateLimiter::hit($pairKey, $decay);

        return false;
    }

    private function findUser(string $email, bool $lock = false): ?User
    {
        $query = User::query()->whereRaw('LOWER(email) = ?', [$email]);

        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->first();
    }

    private function normalizeEmail(string $email): string
    {
        return Str::lower(trim($email));
    }

    private function tooManyAttempts(): JsonResponse
    {
        return response()->json(['message' => 'Bạn thao tác quá nhanh. Vui lòng chờ một lúc rồi thử lại.'], 429);
    }
}
