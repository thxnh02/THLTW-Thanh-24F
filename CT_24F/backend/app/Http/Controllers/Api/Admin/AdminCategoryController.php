<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminCategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return CategoryResource::collection(Category::with('parent')->orderBy('sort_order')->orderBy('id')->paginate(10));
    }

    public function trash(): AnonymousResourceCollection
    {
        return CategoryResource::collection(Category::onlyTrashed()->with('parent')->orderByDesc('deleted_at')->orderByDesc('id')->paginate(10));
    }

    public function trashedShow(int $id): CategoryResource
    {
        return new CategoryResource(Category::onlyTrashed()->with('parent')->findOrFail($id));
    }

    public function options(): JsonResponse
    {
        return response()->json(['data' => Category::query()->orderBy('sort_order')->orderBy('id')->get(['id', 'name', 'parent_id'])]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::create($request->validated());

        return (new CategoryResource($category))->response()->setStatusCode(201);
    }

    public function show(Category $category): CategoryResource
    {
        return new CategoryResource($category->load('parent'));
    }

    public function update(UpdateCategoryRequest $request, Category $category): CategoryResource
    {
        $category->update($request->validated());

        return new CategoryResource($category->fresh()->load('parent'));
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->exists()) {
            return response()->json(['message' => 'This category still has products.'], 409);
        }
        if ($category->children()->exists()) {
            return response()->json(['message' => 'This category still has child categories.'], 409);
        }
        $category->delete();

        return response()->json(['message' => 'Category moved to trash.']);
    }

    public function restore(int $id): JsonResponse|CategoryResource
    {
        $category = Category::onlyTrashed()->findOrFail($id);

        if ($category->parent_id !== null && ! Category::query()->whereKey($category->parent_id)->exists()) {
            return response()->json(['message' => 'Restore the parent category before restoring this category.'], 409);
        }

        $category->restore();

        return new CategoryResource($category->fresh()->load('parent'));
    }

    public function forceDestroy(int $id): JsonResponse
    {
        $category = Category::onlyTrashed()->findOrFail($id);

        if ($category->products()->withTrashed()->exists()) {
            return response()->json(['message' => 'This category has product history and cannot be permanently deleted.'], 409);
        }
        if ($category->children()->withTrashed()->exists()) {
            return response()->json(['message' => 'This category has child category history and cannot be permanently deleted.'], 409);
        }

        $category->forceDelete();

        return response()->json(['message' => 'Category permanently deleted.']);
    }
}
