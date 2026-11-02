<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        // Re-read account state so a block, role removal, or password reset
        // takes effect even while another request still has a valid cookie.
        $user = $request->user()?->fresh();

        if (! $request->hasSession() || $user === null || $user->blocked_at !== null
            || $user->email_verified_at === null
            || (int) $request->session()->get('customer_auth_version') !== (int) $user->customer_auth_version) {
            return response()->json(['message' => 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'], 401);
        }

        if (! $user->is_admin) {
            return response()->json(['message' => 'Bạn không có quyền truy cập trang quản trị.'], 403);
        }

        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
