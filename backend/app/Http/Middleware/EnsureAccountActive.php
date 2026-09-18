<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountActive
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->isLocked()) {
            $request->user()?->currentAccessToken()?->delete();

            return response()->json([
                'success' => false,
                'message' => 'Tài khoản đã bị khóa.',
                'errors' => (object) [],
            ], 403);
        }

        return $next($request);
    }
}
