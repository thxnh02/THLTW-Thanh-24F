<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicPostResource;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PostController extends Controller
{
    /** Cửa hàng chỉ liệt kê bài đã xuất bản và chưa bị xóa. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate(['page' => ['sometimes', 'integer', 'min:1'], 'per_page' => ['sometimes', 'integer', 'min:1', 'max:9']]);

        return PublicPostResource::collection(Post::where('status', true)->orderByDesc('created_at')->orderByDesc('id')->paginate((int) ($filters['per_page'] ?? 9))->withQueryString());
    }

    public function show(string $slug): PublicPostResource
    {
        return new PublicPostResource(Post::where('status', true)->where('slug', $slug)->firstOrFail());
    }
}
