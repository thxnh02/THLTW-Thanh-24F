<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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

        return $this->success($query->paginate((int) $request->integer('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:160', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'in:admin,manager,staff,member'],
            'status' => ['required', 'in:active,locked'],
        ]);

        return $this->success(User::create($validated), 'Da tao tai khoan.', status: 201);
    }

    public function show(User $user): JsonResponse
    {
        return $this->success($user->loadCount('orders'));
    }

    public function update(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:160', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', 'in:admin,manager,staff,member'],
            'status' => ['required', 'in:active,locked'],
        ]);

        if (
            $user->is($request->user())
            && ($validated['role'] !== 'admin' || $validated['status'] !== 'active')
        ) {
            return $this->error('Khong the tu ha quyen hoac khoa tai khoan admin dang dang nhap.', 409);
        }

        if ($user->role === 'admin' && ($validated['role'] !== 'admin' || $validated['status'] !== 'active')) {
            $activeAdminCount = User::query()
                ->where('role', 'admin')
                ->where('status', 'active')
                ->whereKeyNot($user->id)
                ->count();

            if ($activeAdminCount === 0) {
                return $this->error('Khong the khoa hoac ha quyen admin cuoi cung.', 409);
            }
        }

        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $user->update($validated);

        return $this->success($user->refresh()->loadCount('orders'), 'Da cap nhat tai khoan.');
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        if ($user->is($request->user())) {
            return $this->error('Khong the xoa tai khoan dang dang nhap.', 409);
        }

        if ($user->role === 'admin' && User::query()->where('role', 'admin')->where('status', 'active')->whereKeyNot($user->id)->count() === 0) {
            return $this->error('Khong the xoa admin cuoi cung.', 409);
        }

        $user->tokens()->delete();
        $user->delete();

        return $this->success(null, 'Da xoa tai khoan.');
    }
}
