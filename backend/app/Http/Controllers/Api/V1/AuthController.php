<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponses;

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:160', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

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

        return $this->success(['user' => $user], 'Đăng ký thành công.', status: 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

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

        return $this->success(['user' => $user], 'Đăng nhập thành công.');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->success($request->user());
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

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $request->user()->update($validated);

        return $this->success($request->user()->refresh(), 'Đã cập nhật hồ sơ.');
    }

    public function updateEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:160', 'unique:users,email,'.$request->user()->id],
            'current_password' => ['required', 'string'],
        ]);

        if (! Hash::check($validated['current_password'], $request->user()->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Mật khẩu hiện tại không đúng.'],
            ]);
        }

        if ($validated['email'] === $request->user()->email) {
            return $this->success($request->user()->refresh(), 'Email hiện tại không thay đổi.');
        }

        $user = $request->user();
        $user->forceFill(['email' => $validated['email'], 'email_verified_at' => null])->save();
        event(new Registered($user));

        return $this->success($user->refresh(), 'Đã cập nhật email. Vui lòng xác minh địa chỉ mới.');
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'avatar' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = $request->user();
        $oldPath = $user->avatar_path;
        $newPath = $validated['avatar']->store('avatars', 'public');
        $user->update(['avatar_path' => $newPath]);

        if ($oldPath && str_starts_with($oldPath, 'avatars/') && Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }

        return $this->success($user->refresh(), 'Đã cập nhật ảnh đại diện.');
    }

    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        $path = $user->avatar_path;
        $user->update(['avatar_path' => null]);

        if ($path && str_starts_with($path, 'avatars/') && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        return $this->success($user->refresh(), 'Đã xóa ảnh đại diện.');
    }

    public function resendVerification(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return $this->success($request->user()->refresh(), 'Email đã được xác minh.');
        }

        $request->user()->sendEmailVerificationNotification();

        return $this->success(null, 'Đã gửi lại email xác minh.');
    }

    public function verifyEmail(EmailVerificationRequest $request): mixed
    {
        if (! $request->user()->hasVerifiedEmail()) {
            $request->fulfill();
        }

        return redirect(rtrim((string) config('app.frontend_url'), '/').'/account/verify-email?status=success');
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($validated['current_password'], $request->user()->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Mật khẩu hiện tại không đúng.'],
            ]);
        }

        $request->user()->update(['password' => $validated['password']]);
        $request->user()->tokens()->delete();

        return $this->success(null, 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $status = Password::sendResetLink($validated);

        if ($status !== Password::RESET_LINK_SENT) {
            return $this->error(__($status), 422);
        }

        return $this->success(null, 'Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.');
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

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

    private function loginSession(Request $request, User $user): void
    {
        if (! $request->hasSession()) {
            return;
        }

        Auth::login($user);
        $request->session()->regenerate();
    }
}
