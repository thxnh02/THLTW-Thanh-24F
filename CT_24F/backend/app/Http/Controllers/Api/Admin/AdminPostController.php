<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminPostController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return PostResource::collection(Post::orderByDesc('id')->paginate(10));
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $post = Post::create($request->validated());

        return (new PostResource($post))->response()->setStatusCode(201);
    }

    public function show(Post $post): PostResource
    {
        return new PostResource($post);
    }

    public function update(UpdatePostRequest $request, Post $post): PostResource
    {
        $post->update($request->validated());

        return new PostResource($post->fresh());
    }

    public function destroy(Post $post): JsonResponse
    {
        $post->delete();

        return response()->json(['message' => 'Đã chuyển bài viết vào thùng rác.']);
    }

    /** Danh sách bài viết đã xóa mềm, có phân trang. */
    public function trash(): AnonymousResourceCollection
    {
        return PostResource::collection(Post::onlyTrashed()->orderByDesc('deleted_at')->orderByDesc('id')->paginate(10));
    }

    public function restore(int $id): PostResource
    {
        $post = Post::onlyTrashed()->findOrFail($id);
        $post->restore();

        return new PostResource($post->fresh());
    }

    /** Chỉ bài viết trong thùng rác mới được xóa vĩnh viễn. */
    public function forceDestroy(int $id): JsonResponse
    {
        Post::onlyTrashed()->findOrFail($id)->forceDelete();

        return response()->json(['message' => 'Đã xóa vĩnh viễn bài viết.']);
    }
}
