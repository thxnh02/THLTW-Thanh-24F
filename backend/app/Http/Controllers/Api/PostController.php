<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicPostResource;
use App\Models\Post;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PostController extends Controller
{
    /** Cửa hàng chỉ liệt kê bài đã xuất bản và chưa bị xóa. */
    public function index(): AnonymousResourceCollection
    {
        return PublicPostResource::collection(Post::where('status', true)->orderByDesc('id')->paginate(9));
    }

    public function show(string $slug): PublicPostResource
    {
        return new PublicPostResource(Post::where('status', true)->where('slug', $slug)->firstOrFail());
    }
}
