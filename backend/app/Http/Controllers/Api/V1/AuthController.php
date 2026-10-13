<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\EmailOnlyRequest;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResetPasswordOtpRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Requests\UpdateEmailRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Requests\UploadAvatarRequest;
use App\Http\Requests\VerifyEmailCodeRequest;
use App\Http\Resources\UserResource;
use App\Mail\PasswordResetOtpMail;
use App\Models\EmailVerificationCode;
use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponses;

    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => $validated['password'],
            'role' => 'member',
            'status' => 'active',
        ]);

        event(new Registered($user));

        $this->loginSession($request, $user);

        return $this->success(['user' => new UserResource($user)], 'Đăng ký thành công.', status: 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $limiterKey = Str::lower($validated['email']).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($limiterKey, 5)) {
            throw ValidationException::withMessages([
                'email' => ['Đăng nhập quá nhiều lần. Vui lòng thử lại sau.'],
            ]);
        }

        $user = User::query()->where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            RateLimiter::hit($limiterKey, 60);

            throw ValidationException::withMessages([
                'email' => ['Thông tin đăng nhập không đúng.'],
            ]);
        }

        RateLimiter::clear($limiterKey);

        if ($user->isLocked()) {
            return $this->error('Tài khoản đã bị khóa.', 403);
        }

        $this->loginSession($request, $user);

        return $this->success(['user' => new UserResource($user)], 'Đăng nhập thành công.');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->success(new UserResource($request->user()));
    }

    public function logout(Request $request): JsonResponse
    {
        $accessToken = $request->user()?->currentAccessToken();

        if ($accessToken && method_exists($accessToken, 'delete')) {
            $accessToken->delete();
        }

        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return $this->success(null, 'Đã đăng xuất.');
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $request->user()->update($validated);

        return $this->success(new UserResource($request->user()->refresh()), 'Đã cập nhật hồ sơ.');
    }

    public function updateEmail(UpdateEmailRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if (! Hash::check($validated['current_password'], $request->user()->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Mật khẩu hiện tại không đúng.'],
            ]);
        }

        if ($validated['email'] === $request->user()->email) {
            return $this->success(new UserResource($request->user()->refresh()), 'Email hiện tại không thay đổi.');
        }

        $user = $request->user();
        $user->forceFill(['email' => $validated['email'], 'email_verified_at' => null])->save();
        event(new Registered($user));

        return $this->success(new UserResource($user->refresh()), 'Đã cập nhật email. Vui lòng xác minh địa chỉ mới.');
    }

    public function uploadAvatar(UploadAvatarRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = $request->user();
        $oldPath = $user->avatar_path;
        $disk = (string) config('filesystems.public_disk', 'public');
        $newPath = $validated['avatar']->store('avatars', $disk);
        $user->update(['avatar_path' => $newPath]);

        if ($oldPath && str_starts_with($oldPath, 'avatars/') && Storage::disk($disk)->exists($oldPath)) {
            Storage::disk($disk)->delete($oldPath);
        }

        return $this->success(new UserResource($user->refresh()), 'Đã cập nhật ảnh đại diện.');
    }

    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        $path = $user->avatar_path;
        $disk = (string) config('filesystems.public_disk', 'public');
        $user->update(['avatar_path' => null]);

        if ($path && str_starts_with($path, 'avatars/') && Storage::disk($disk)->exists($path)) {
            Storage::disk($disk)->delete($path);
        }

        return $this->success(new UserResource($user->refresh()), 'Đã xóa ảnh đại diện.');
    }

    public function resendVerification(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return $this->success(new UserResource($request->user()->refresh()), 'Email đã được xác minh.');
        }

        $request->user()->sendEmailVerificationNotification();

        return $this->success(null, 'Yêu cầu gửi email xác minh đã được xử lý theo cấu hình email hiện tại.');
    }

    public function verifyEmailCode(VerifyEmailCodeRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return $this->success(new UserResource($user->refresh()), 'Email đã được xác minh.');
        }

        $verificationCode = EmailVerificationCode::query()
            ->where('user_id', $user->id)
            ->whereNull('used_at')
            ->latest('id')
            ->first();

        if (! $verificationCode || $verificationCode->expires_at->isPast() || $verificationCode->attempts >= 5) {
            throw ValidationException::withMessages([
                'code' => ['Mã xác nhận không hợp lệ hoặc đã hết hạn. Vui lòng gửi mã mới.'],
            ]);
        }

        $verificationCode->increment('attempts');

        if (! Hash::check($validated['code'], $verificationCode->code_hash)) {
            throw ValidationException::withMessages([
                'code' => ['Mã xác nhận không đúng.'],
            ]);
        }

        $verificationCode->update(['used_at' => now()]);
        EmailVerificationCode::query()
            ->where('user_id', $user->id)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);
        $user->markEmailAsVerified();

        return $this->success(new UserResource($user->refresh()), 'Email đã được xác minh.');
    }

    public function verifyEmail(Request $request, int $id, string $hash): mixed
    {
        $user = User::query()->findOrFail($id);

        abort_unless(hash_equals(sha1($user->getEmailForVerification()), $hash), 403);

        if (! $request->user()) {
            $loginUrl = rtrim((string) config('app.frontend_url'), '/').'/login?'.http_build_query([
                'verification_url' => $request->fullUrl(),
            ]);

            return redirect($loginUrl);
        }

        abort_unless($request->user()->is($user), 403);

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            EmailVerificationCode::query()
                ->where('user_id', $user->id)
                ->whereNull('used_at')
                ->update(['used_at' => now()]);
        }

        return redirect(rtrim((string) config('app.frontend_url'), '/').'/account/verify-email?status=success');
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if (! Hash::check($validated['current_password'], $request->user()->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Mật khẩu hiện tại không đúng.'],
            ]);
        }

        $request->user()->update(['password' => $validated['password']]);
        $request->user()->tokens()->delete();

        return $this->success(null, 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.');
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $status = Password::sendResetLink($validated);

        if ($status !== Password::RESET_LINK_SENT) {
            return $this->error(__($status), 422);
        }

        return $this->success(null, 'Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.');
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $status = Password::reset(
            $validated,
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            return $this->error(__($status), 422);
        }

        return $this->success(null, 'Đã đặt lại mật khẩu.');
    }

    public function forgotPasswordOtp(EmailOnlyRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $this->sendPasswordResetOtp($validated['email']);

        return $this->success(null, 'Nếu email tồn tại, mã OTP đặt lại mật khẩu đã được gửi.');
    }

    public function resendPasswordOtp(EmailOnlyRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $this->sendPasswordResetOtp($validated['email']);

        return $this->success(null, 'Nếu email tồn tại, mã OTP mới đã được gửi.');
    }

    public function resetPasswordOtp(ResetPasswordOtpRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::query()->where('email', $validated['email'])->first();
        $otp = $user
            ? PasswordResetOtp::query()->where('user_id', $user->id)->whereNull('used_at')->latest('id')->first()
            : null;

        if (! $otp || $otp->expires_at->isPast() || $otp->attempts >= 5) {
            return $this->error('Mã OTP không hợp lệ hoặc đã hết hạn.', 422);
        }

        $otp->increment('attempts');

        if (! Hash::check($validated['token'], $otp->code_hash)) {
            return $this->error('Mã OTP không hợp lệ hoặc đã hết hạn.', 422);
        }

        $user->forceFill([
            'password' => $validated['password'],
            'remember_token' => Str::random(60),
        ])->save();
        $otp->update(['used_at' => now()]);
        event(new PasswordReset($user));

        return $this->success(null, 'Đã đặt lại mật khẩu bằng OTP.');
    }

    private function sendPasswordResetOtp(string $email): void
    {
        $user = User::query()->where('email', $email)->first();

        if (! $user) {
            return;
        }

        PasswordResetOtp::query()->where('user_id', $user->id)->whereNull('used_at')->update(['used_at' => now()]);
        $code = (string) random_int(100000, 999999);
        PasswordResetOtp::create([
            'user_id' => $user->id,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
        ]);

        Mail::to($user)->send(new PasswordResetOtpMail($code));
    }

    private function loginSession(Request $request, User $user): void
    {
        if (! $request->hasSession()) {
            return;
        }

        Auth::login($user);
        $request->session()->regenerate();
    }
}
