<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
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

        $this->loginSession($request, $user);

        return $this->success(['user' => $user], 'Dang ky thanh cong.', status: 201);
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
                'email' => ['Dang nhap qua nhieu lan. Vui long thu lai sau.'],
            ]);
        }

        $user = User::query()->where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            RateLimiter::hit($limiterKey, 60);

            throw ValidationException::withMessages([
                'email' => ['Thong tin dang nhap khong dung.'],
            ]);
        }

        RateLimiter::clear($limiterKey);

        if ($user->isLocked()) {
            return $this->error('Tai khoan da bi khoa.', 403);
        }

        $this->loginSession($request, $user);

        return $this->success(['user' => $user], 'Dang nhap thanh cong.');
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

        return $this->success(null, 'Da dang xuat.');
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $request->user()->update($validated);

        return $this->success($request->user()->refresh(), 'Da cap nhat ho so.');
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($validated['current_password'], $request->user()->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Mat khau hien tai khong dung.'],
            ]);
        }

        $request->user()->update(['password' => $validated['password']]);
        $request->user()->tokens()->delete();

        return $this->success(null, 'Da doi mat khau. Vui long dang nhap lai.');
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

        return $this->success(null, 'Neu email ton tai, lien ket dat lai mat khau da duoc gui.');
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

        return $this->success(null, 'Da dat lai mat khau.');
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
