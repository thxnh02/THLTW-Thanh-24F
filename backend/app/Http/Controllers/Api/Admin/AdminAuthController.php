<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureAdminBrowserSession;
use App\Models\AdminBrowserSession;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        AdminBrowserSession::query()->where('user_id', $user->id)->where('expires_at', '<=', now())->delete();
        $plainToken = Str::random(80);
        AdminBrowserSession::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $plainToken),
            'customer_auth_version' => (int) $user->customer_auth_version,
            'expires_at' => now()->addMinutes((int) config('session.lifetime', 120)),
        ]);
        RateLimiter::clear($limitKey);

        return response()->json(['data' => ['user' => $this->userData($user)]])
            ->withCookie(app(EnsureAdminBrowserSession::class)->authCookie($plainToken, (int) config('session.lifetime', 120)));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => ['user' => $this->userData($request->user())]]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->attributes->get('admin_browser_session')?->delete();

        return response()->json(['message' => 'Đã đăng xuất quản trị.'])
            ->withCookie(app(EnsureAdminBrowserSession::class)->authCookie('', -262800));
    }

    private function userData(User $user): array
    {
        return ['id' => $user->id, 'name' => $user->name, 'email' => $user->email];
    }
}
