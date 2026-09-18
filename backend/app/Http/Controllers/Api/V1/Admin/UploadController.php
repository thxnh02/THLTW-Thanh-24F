<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        $directory = 'uploads/images';

        if ($request->filled('directory')) {
            $directory .= '/'.$request->validate([
                'directory' => ['required', 'string', 'max:60', 'regex:/^[a-z0-9-]+$/'],
            ])['directory'];
        }

        $files = collect(Storage::disk('public')->allFiles($directory))
            ->filter(fn (string $path): bool => preg_match('/\.(jpe?g|png|webp|gif)$/i', $path) === 1)
            ->map(fn (string $path): array => [
                'path' => $path,
                'url' => Storage::disk('public')->url($path),
                'size' => Storage::disk('public')->size($path),
                'last_modified' => Storage::disk('public')->lastModified($path),
            ])
            ->sortByDesc('last_modified')
            ->values();

        return $this->success($files);
    }

    public function image(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:2048'],
            'directory' => ['nullable', 'string', 'max:60', 'regex:/^[a-z0-9-]+$/'],
        ]);

        $directory = 'uploads/images/'.($validated['directory'] ?? now()->format('Y/m'));
        $file = $validated['image'];
        $path = $file->store($directory, 'public');

        return $this->success([
            'disk' => 'public',
            'path' => $path,
            'url' => Storage::disk('public')->url($path),
            'mime' => $file->getMimeType(),
            'size' => $file->getSize(),
            'original_name' => $file->getClientOriginalName(),
        ], 'Đã tải ảnh lên.', status: 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'path' => ['required', 'string', 'max:255'],
        ]);

        $path = ltrim($validated['path'], '/');

        if (! str_starts_with($path, 'uploads/images/')) {
            return $this->error('Đường dẫn ảnh không hợp lệ.', 422);
        }

        if (! Storage::disk('public')->exists($path)) {
            return $this->error('Ảnh không tồn tại.', 404);
        }

        Storage::disk('public')->delete($path);

        return $this->success(null, 'Đã xóa ảnh.');
    }
}
