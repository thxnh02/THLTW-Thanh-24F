<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminUserController extends Controller
{
    /** Danh sách tài khoản thật, kèm số đơn hàng và phân trang từ database. */
    public function index(): AnonymousResourceCollection
    {
        return UserResource::collection(User::where('is_admin', false)->withCount('orders')->orderByDesc('id')->paginate(10));
    }

    public function show(User $user): UserResource
    {
        abort_if($user->is_admin, 404);

        return new UserResource($user->loadCount('orders'));
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
