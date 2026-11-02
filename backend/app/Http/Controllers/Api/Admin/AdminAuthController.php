<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AdminAuthController extends Controller
{
    private const DUMMY_PASSWORD_HASH = '$2y$12$WZ6qid8j2VTVkIDUiLP4J./3wFanpBT5wx/sbw.02b2bB6Dix6ztO';

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email:rfc', 'max:254'],
            'password' => ['required', 'string', 'max:128'],
        ]);

        $email = Str::lower(trim($data['email']));
        $limitKey = 'admin-login:'.hash('sha256', $email.'|'.$request->ip());
        if (RateLimiter::tooManyAttempts($limitKey, 5)) {
            return response()->json(['message' => 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng chờ một phút.'], 429);
        }
        RateLimiter::hit($limitKey, 60);

        $user = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();
        $passwordMatches = Hash::check($data['password'], $user?->password ?: self::DUMMY_PASSWORD_HASH);
        if (! $passwordMatches || ! $user?->is_admin || $user->blocked_at !== null || $user->email_verified_at === null) {
            return response()->json(['message' => 'Thông tin đăng nhập quản trị không hợp lệ.'], 422);
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $request->session()->put('customer_auth_version', (int) $user->customer_auth_version);
        RateLimiter::clear($limitKey);

        return response()->json(['data' => ['user' => $this->userData($user)]]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => ['user' => $this->userData($request->user())]]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Đã đăng xuất quản trị.']);
    }

    private function userData(User $user): array
    {
        return ['id' => $user->id, 'name' => $user->name, 'email' => $user->email];
    }
}
