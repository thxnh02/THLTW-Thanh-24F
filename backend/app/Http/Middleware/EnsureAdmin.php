<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->canAccessAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập khu vực quản trị.',
                'errors' => (object) [],
            ], 403);
        }

        $permission = $this->permissionForPath($request->path());

        if ($permission && ! $user->hasAdminPermission($permission)) {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản không có quyền thực hiện thao tác này.',
                'errors' => (object) [],
            ], 403);
        }

        return $next($request);
    }

    private function permissionForPath(string $path): ?string
    {
        $adminPath = str($path)->after('api/v1/admin/')->before('/')->toString();

        return match ($adminPath) {
            'dashboard' => 'dashboard',
            'reports' => 'reports',
            'orders' => 'orders',
            'returns' => 'returns',
            'shipping-methods' => 'shipping',
            'stock' => 'stock',
            'contacts' => 'contacts',
            'products', 'categories', 'brands' => 'catalog',
            'promotions' => 'promotions',
            'posts', 'post-categories', 'pages', 'menus', 'banners', 'media', 'uploads' => 'content',
            'settings' => 'settings',
            'users' => 'users',
            default => null,
        };
    }
}
