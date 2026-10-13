<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('users'), 403);

        $query = User::query()->withCount('orders')->latest('id');

        if ($request->filled('q')) {
            $needle = $request->string('q')->trim()->toString();
            $query->where(function ($userQuery) use ($needle): void {
                $userQuery
                    ->where('name', 'like', '%'.$needle.'%')
                    ->orWhere('email', 'like', '%'.$needle.'%')
                    ->orWhere('phone', 'like', '%'.$needle.'%');
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->string('role'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return $this->successPaginated($query->paginate((int) $request->integer('per_page', 15)), UserResource::class);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $request->validated();

        return $this->success(new UserResource(User::create($validated)), 'Đã tạo tài khoản.', status: 201);
    }

    public function show(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('users'), 403);

        return $this->success(new UserResource($user->loadCount('orders')));
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $request->validated();

        if (
            $user->is($request->user())
            && ($validated['role'] !== 'admin' || $validated['status'] !== 'active')
        ) {
            return $this->error('Không thể tự hạ quyền hoặc khóa tài khoản quản trị đang đăng nhập.', 409);
        }

        if ($user->role === 'admin' && ($validated['role'] !== 'admin' || $validated['status'] !== 'active')) {
            $activeAdminCount = User::query()
                ->where('role', 'admin')
                ->where('status', 'active')
                ->whereKeyNot($user->id)
                ->count();

            if ($activeAdminCount === 0) {
                return $this->error('Không thể khóa hoặc hạ quyền quản trị viên cuối cùng.', 409);
            }
        }

        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $user->update($validated);

        return $this->success(new UserResource($user->refresh()->loadCount('orders')), 'Đã cập nhật tài khoản.');
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        if ($user->is($request->user())) {
            return $this->error('Không thể xóa tài khoản đang đăng nhập.', 409);
        }

        if ($user->role === 'admin' && User::query()->where('role', 'admin')->where('status', 'active')->whereKeyNot($user->id)->count() === 0) {
            return $this->error('Không thể xóa quản trị viên cuối cùng.', 409);
        }

        $user->tokens()->delete();
        $user->delete();

        return $this->success(null, 'Đã xóa tài khoản.');
    }
}
