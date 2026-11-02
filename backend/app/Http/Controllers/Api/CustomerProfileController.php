<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerAccountResource;
use App\Http\Resources\CustomerAddressResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class CustomerProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $default = $user->addresses()->where('is_default', true)->first();

        return response()->json(['data' => [
            'user' => CustomerAccountResource::make($user),
            'default_address' => $default ? CustomerAddressResource::make($default) : null,
        ]]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'phone' => ['nullable', 'string', 'regex:/^(0\d{9}|\+84\d{9})$/'],
        ]);
        $data['name'] = trim($data['name']);
        if ($data['name'] === '') {
            throw ValidationException::withMessages(['name' => 'Vui lòng nhập họ và tên.']);
        }

        $user = $request->user();
        $updates = ['name' => $data['name']];
        if (array_key_exists('phone', $data)) {
            $updates['phone'] = $data['phone'];
        }
        $user->forceFill($updates)->save();

        return $this->userResponse($user, 'Đã cập nhật hồ sơ.');
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate(['avatar' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048']]);
        $file = $request->file('avatar');
        $size = @getimagesize($file->getRealPath());
        $mime = $size['mime'] ?? null;
        $extension = match ($mime) {
            'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', default => null,
        };
        if ($extension === null) {
            throw ValidationException::withMessages(['avatar' => 'Tệp phải là ảnh JPEG, PNG hoặc WebP hợp lệ.']);
        }
        if (($size[0] ?? 0) < 1 || ($size[1] ?? 0) < 1 || $size[0] > 4096 || $size[1] > 4096 || $size[0] * $size[1] > 12_000_000) {
            throw ValidationException::withMessages(['avatar' => 'Ảnh cần có kích thước tối đa 4096 × 4096 pixel và không quá 12 triệu pixel.']);
        }

        $user = $request->user();
        $path = Storage::disk('public')->putFileAs('avatars/'.$user->id, $file, Str::random(40).'.'.$extension);
        if (! $path) {
            return response()->json(['message' => 'Không thể lưu ảnh lúc này. Vui lòng thử lại.'], 503);
        }

        $oldPath = $user->avatar_path;
        $user->forceFill(['avatar_path' => $path])->save();
        $this->deleteOwnedAvatar($user->id, $oldPath);

        return $this->userResponse($user, 'Đã cập nhật ảnh đại diện.');
    }

    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        $path = $user->avatar_path;
        $user->forceFill(['avatar_path' => null])->save();
        $this->deleteOwnedAvatar($user->id, $path);

        return $this->userResponse($user, 'Đã xóa ảnh đại diện.');
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', Password::min(8)->max(128), 'confirmed', 'different:current_password'],
        ]);

        DB::transaction(function () use ($request, $data): void {
            $user = $request->user()->newQuery()->whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            if (! Hash::check($data['current_password'], $user->password ?? '')) {
                throw ValidationException::withMessages(['current_password' => 'Mật khẩu hiện tại không chính xác.']);
            }
            $user->forceFill([
                'password' => Hash::make($data['password']),
                'remember_token' => Str::random(60),
                'customer_auth_version' => (int) $user->customer_auth_version + 1,
            ])->save();
        });

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.']);
    }

    private function userResponse($user, string $message): JsonResponse
    {
        return response()->json(['message' => $message, 'data' => ['user' => CustomerAccountResource::make($user->fresh())]]);
    }

    private function deleteOwnedAvatar(int $userId, ?string $path): void
    {
        if ($path && preg_match('~^avatars/'.preg_quote((string) $userId, '~').'/[A-Za-z0-9]{40}\.(jpg|png|webp)$~', $path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
