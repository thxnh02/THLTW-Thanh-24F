<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostCategoryRequest;
use App\Http\Requests\UpdatePostCategoryRequest;
use App\Http\Resources\PostCategoryResource;
use App\Models\PostCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostCategoryController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        $query = PostCategory::query()->withCount('posts')->latest('id');

        if ($request->filled('q')) {
            $query->where('name', 'like', '%'.$request->string('q')->trim()->toString().'%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return $this->success($query->paginate((int) $request->integer('per_page', 15)));
    }

    public function store(StorePostCategoryRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return $this->success(new PostCategoryResource(PostCategory::create($validated)), 'Đã tạo chủ đề bài viết.', status: 201);
    }

    public function show(PostCategory $postCategory): JsonResponse
    {
        return $this->success(new PostCategoryResource($postCategory->loadCount('posts')));
    }

    public function update(UpdatePostCategoryRequest $request, PostCategory $postCategory): JsonResponse
    {
        $validated = $request->validated();
        $postCategory->update($validated);

        return $this->success(new PostCategoryResource($postCategory->refresh()->loadCount('posts')), 'Đã cập nhật chủ đề bài viết.');
    }

    public function destroy(PostCategory $postCategory): JsonResponse
    {
        if ($postCategory->posts()->exists()) {
            return $this->error('Chủ đề đang có bài viết, không thể xóa.', 409);
        }

        $postCategory->delete();

        return $this->success(null, 'Đã xóa chủ đề bài viết.');
    }
}
