<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminUserController extends Controller
{
    /** Danh sách tài khoản thật, kèm số đơn hàng và phân trang từ database. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate(['q' => ['nullable', 'string', 'max:100'], 'status' => ['nullable', 'in:active,blocked']]);
        $query = User::where('is_admin', false)->withCount('orders');
        if ($term = trim($filters['q'] ?? '')) {
            $like = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $term).'%';
            $query->where(fn ($q) => $q->whereRaw("name LIKE ? ESCAPE '!'", [$like])->orWhereRaw("email LIKE ? ESCAPE '!'", [$like])->orWhereRaw("phone LIKE ? ESCAPE '!'", [$like]));
        }
        if (($filters['status'] ?? null) === 'blocked') $query->whereNotNull('blocked_at');
        if (($filters['status'] ?? null) === 'active') $query->whereNull('blocked_at');
        return UserResource::collection($query->orderByDesc('id')->paginate(10)->withQueryString());
    }

    public function show(User $user): UserResource
    {
        abort_if($user->is_admin, 404);

        return new UserResource($user->loadCount('orders')->load(['addresses', 'orders' => fn ($query) => $query->orderByDesc('id')->limit(20)]));
    }

    public function destroy(User $user)
    {
        abort_if($user->is_admin, 403);
        DB::transaction(function () use ($user): void {
            $locked = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            if ($locked->orders()->exists()) {
                throw ValidationException::withMessages(['user' => 'Tài khoản đã có đơn hàng. Hãy khóa tài khoản để giữ lịch sử đơn hàng.']);
            }
            $locked->delete();
        });
        return response()->noContent();
    }

    public function block(User $user): UserResource
    {
        abort_if($user->is_admin, 403);

        if ($user->blocked_at === null) {
            $user->update(['blocked_at' => now()]);
        }

        return new UserResource($user->fresh()->loadCount('orders'));
    }

    public function unblock(User $user): UserResource
    {
        abort_if($user->is_admin, 403);

        if ($user->blocked_at !== null) {
            $user->update(['blocked_at' => null]);
        }

        return new UserResource($user->fresh()->loadCount('orders'));
    }
}
