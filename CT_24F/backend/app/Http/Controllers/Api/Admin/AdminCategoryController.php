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
    /** GET /api/admin/categories — paginated active categories. */
    public function index(): AnonymousResourceCollection
    {
        return CategoryResource::collection(Category::with('parent')->orderBy('sort_order')->orderBy('id')->paginate(10));
    }

    /** GET /api/admin/categories/trash — paginated soft-deleted categories. */
    public function trash(): AnonymousResourceCollection
    {
        return CategoryResource::collection(Category::onlyTrashed()->with('parent')->orderByDesc('deleted_at')->orderByDesc('id')->paginate(10));
    }

    /** GET /api/admin/categories/trash/{id} — fetch a deleted category. */
    public function trashedShow(int $id): CategoryResource
    {
        return new CategoryResource(Category::onlyTrashed()->with('parent')->findOrFail($id));
    }

    /** GET /api/admin/categories/options — compact active category options for forms. */
    public function options(): JsonResponse
    {
        return response()->json(['data' => Category::query()->orderBy('sort_order')->orderBy('id')->get(['id', 'name', 'parent_id'])]);
    }

    /** POST /api/admin/categories — validate and create a category (201). */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::create($request->validated());

        return (new CategoryResource($category))->response()->setStatusCode(201);
    }

    /** GET /api/admin/categories/{category} — fetch one active category for editing. */
    public function show(Category $category): CategoryResource
    {
        return new CategoryResource($category->load('parent'));
    }

    /** PUT/PATCH /api/admin/categories/{category} — validate and update a category. */
    public function update(UpdateCategoryRequest $request, Category $category): CategoryResource
    {
        $category->update($request->validated());

        return new CategoryResource($category->fresh()->load('parent'));
    }

    /** DELETE /api/admin/categories/{category} — move to trash when no active dependants exist. */
    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->exists()) {
            return response()->json(['message' => 'Danh mục này vẫn có sản phẩm.'], 409);
        }
        if ($category->children()->exists()) {
            return response()->json(['message' => 'Danh mục này vẫn có danh mục con.'], 409);
        }
        $category->delete();

        return response()->json(['message' => 'Đã chuyển danh mục vào thùng rác.']);
    }

    /** POST /api/admin/categories/{id}/restore — restore after its parent is available. */
    public function restore(int $id): JsonResponse|CategoryResource
    {
        $category = Category::onlyTrashed()->findOrFail($id);

        if ($category->parent_id !== null && ! Category::query()->whereKey($category->parent_id)->exists()) {
            return response()->json(['message' => 'Hãy khôi phục danh mục cha trước khi khôi phục danh mục này.'], 409);
        }

        $category->restore();

        return new CategoryResource($category->fresh()->load('parent'));
    }

    /** DELETE /api/admin/categories/{id}/force — permanently delete when no history depends on it. */
    public function forceDestroy(int $id): JsonResponse
    {
        $category = Category::onlyTrashed()->findOrFail($id);

        if ($category->products()->withTrashed()->exists()) {
            return response()->json(['message' => 'Danh mục này có lịch sử sản phẩm nên không thể xóa vĩnh viễn.'], 409);
        }
        if ($category->children()->withTrashed()->exists()) {
            return response()->json(['message' => 'Danh mục này có lịch sử danh mục con nên không thể xóa vĩnh viễn.'], 409);
        }

        $category->forceDelete();

        return response()->json(['message' => 'Đã xóa vĩnh viễn danh mục.']);
    }
}
