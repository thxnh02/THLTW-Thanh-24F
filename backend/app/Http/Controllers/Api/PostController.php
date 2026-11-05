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
        $filters = $request->validate(['page' => ['sometimes', 'integer', 'min:1'], 'per_page' => ['sometimes', 'integer', 'min:1', 'max:9'], 'topic' => ['nullable', 'string', 'max:150']]);

        $query = Post::where('status', true)->with('topic');
        if (! empty($filters['topic'])) $query->whereHas('topic', fn ($q) => $q->where('slug', $filters['topic']));
        return PublicPostResource::collection($query->orderByDesc('created_at')->orderByDesc('id')->paginate((int) ($filters['per_page'] ?? 9))->withQueryString());
    }

    public function show(string $slug): PublicPostResource
    {
        return new PublicPostResource(Post::where('status', true)->with('topic')->where('slug', $slug)->firstOrFail());
    }
}
