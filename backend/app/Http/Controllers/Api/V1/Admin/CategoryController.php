<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        $query = Category::query()->withCount('products')->orderBy('sort_order')->latest('id');

        if ($request->filled('q')) {
            $query->where('name', 'like', '%'.$request->string('q')->trim()->toString().'%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return $this->successPaginated($query->paginate((int) $request->integer('per_page', 15)), CategoryResource::class);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return $this->success(new CategoryResource(Category::create($validated)), 'Đã tạo danh mục.', status: 201);
    }

    public function show(Category $category): JsonResponse
    {
        return $this->success(new CategoryResource($category->loadCount('products')));
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $validated = $request->validated();
        $category->update($validated);

        return $this->success(new CategoryResource($category->refresh()), 'Đã cập nhật danh mục.');
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->exists()) {
            return $this->error('Danh mục đang có sản phẩm, không thể xóa.', 409);
        }

        $category->delete();

        return $this->success(null, 'Đã xóa danh mục.');
    }
}
