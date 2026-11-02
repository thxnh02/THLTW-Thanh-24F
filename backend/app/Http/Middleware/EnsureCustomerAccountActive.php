<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCustomerAccountActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $sessionVersion = $request->session()->get('customer_auth_version');

        if ($user === null || $user->blocked_at !== null || (int) $sessionVersion !== (int) $user->customer_auth_version) {
            return response()->json(['message' => 'Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.'], 401);
        }

        return $next($request);
    }
}
