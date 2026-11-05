<?php

namespace App\Http\Middleware;

use App\Models\AdminBrowserSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminBrowserSession
{
    public const COOKIE_NAME = 'ct24f_admin_auth';

    public const COOKIE_PATH = '/api/admin';

    public function handle(Request $request, Closure $next): Response
    {
        $plainToken = $request->cookie(self::COOKIE_NAME);
        if (! is_string($plainToken) || ! preg_match('/^[A-Za-z0-9]{80}$/', $plainToken)) {
            return $this->unauthenticated();
        }

        $browserSession = AdminBrowserSession::query()->with('user')
            ->where('token_hash', hash('sha256', $plainToken))
            ->where('expires_at', '>', now())->first();
        $user = $browserSession?->user;
        if (! $browserSession || ! $user || $user->blocked_at !== null || $user->email_verified_at === null
            || (int) $browserSession->customer_auth_version !== (int) $user->customer_auth_version) {
            $browserSession?->delete();

            return $this->unauthenticated();
        }

        if (! $user->is_admin) {
            $browserSession->delete();

            return response()->json(['message' => 'Bạn không có quyền truy cập trang quản trị.'], 403)
                ->withCookie($this->forgetCookie());
        }

        $request->setUserResolver(fn () => $user);
        $request->attributes->set('admin_browser_session', $browserSession);

        return $next($request);
    }

    public function authCookie(string $token, int $minutes): Cookie
    {
        return cookie(self::COOKIE_NAME, $token, $minutes, self::COOKIE_PATH,
            config('session.domain'), (bool) config('session.secure'), true, false, 'lax');
    }

    private function unauthenticated(): Response
    {
        return response()->json(['message' => 'Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.'], 401)
            ->withCookie($this->forgetCookie());
    }

    private function forgetCookie(): Cookie
    {
        return cookie(self::COOKIE_NAME, '', -262800, self::COOKIE_PATH,
            config('session.domain'), (bool) config('session.secure'), true, false, 'lax');
    }
}
