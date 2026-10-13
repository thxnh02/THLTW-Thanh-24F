<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\AdminImageUploadRequest;
use App\Http\Requests\DeleteImageRequest;
use App\Http\Requests\ImageDirectoryRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    use ApiResponses;

    public function index(ImageDirectoryRequest $request): JsonResponse
    {
        $disk = (string) config('filesystems.public_disk', 'public');
        $directory = 'uploads/images';

        if ($request->filled('directory')) {
            $directory .= '/'.$request->validated()['directory'];
        }

        $files = collect(Storage::disk($disk)->allFiles($directory))
            ->filter(fn (string $path): bool => preg_match('/\.(jpe?g|png|webp|gif)$/i', $path) === 1)
            ->map(fn (string $path): array => [
                'path' => $path,
                'url' => Storage::disk($disk)->url($path),
                'size' => Storage::disk($disk)->size($path),
                'last_modified' => Storage::disk($disk)->lastModified($path),
            ])
            ->sortByDesc('last_modified')
            ->values();

        return $this->success($files);
    }

    public function image(AdminImageUploadRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $directory = 'uploads/images/'.($validated['directory'] ?? now()->format('Y/m'));
        $file = $validated['image'];
        $disk = (string) config('filesystems.public_disk', 'public');
        $path = $file->store($directory, $disk);

        return $this->success([
            'disk' => $disk,
            'path' => $path,
            'url' => Storage::disk($disk)->url($path),
            'mime' => $file->getMimeType(),
            'size' => $file->getSize(),
            'original_name' => $file->getClientOriginalName(),
        ], 'Đã tải ảnh lên.', status: 201);
    }

    public function destroy(DeleteImageRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $path = ltrim($validated['path'], '/');
        $disk = (string) config('filesystems.public_disk', 'public');

        if (! str_starts_with($path, 'uploads/images/')) {
            return $this->error('Đường dẫn ảnh không hợp lệ.', 422);
        }

        if (! Storage::disk($disk)->exists($path)) {
            return $this->error('Ảnh không tồn tại.', 404);
        }

        Storage::disk($disk)->delete($path);

        return $this->success(null, 'Đã xóa ảnh.');
    }
}
