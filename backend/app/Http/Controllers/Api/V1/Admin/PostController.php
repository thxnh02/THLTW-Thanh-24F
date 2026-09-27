<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        $query = Post::query()->with('category')->latest('id');

        if ($request->filled('q')) {
            $query->where('title', 'like', '%'.$request->string('q')->trim()->toString().'%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('category')) {
            $query->where('post_category_id', $request->integer('category'));
        }

        return $this->successPaginated($query->paginate((int) $request->integer('per_page', 15)), PostResource::class);
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return $this->success(new PostResource(Post::create($validated)->load('category')), 'Đã tạo bài viết.', status: 201);
    }

    public function show(Post $post): JsonResponse
    {
        return $this->success(new PostResource($post->load('category')));
    }

    public function update(UpdatePostRequest $request, Post $post): JsonResponse
    {
        $validated = $request->validated();
        $post->update($validated);

        return $this->success(new PostResource($post->refresh()->load('category')), 'Đã cập nhật bài viết.');
    }

    public function destroy(Post $post): JsonResponse
    {
        $post->delete();

        return $this->success(null, 'Đã xóa bài viết.');
    }
}
