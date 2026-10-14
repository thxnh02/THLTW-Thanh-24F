<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBrandRequest;
use App\Http\Requests\UpdateBrandRequest;
use App\Http\Resources\BrandResource;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminBrandController extends Controller
{
    /** GET /api/admin/brands — paginated active brands. */
    public function index(): AnonymousResourceCollection
    {
        return BrandResource::collection(Brand::orderBy('sort_order')->orderBy('id')->paginate(10));
    }

    /** GET /api/admin/brands/trash — paginated soft-deleted brands. */
    public function trash(): AnonymousResourceCollection
    {
        return BrandResource::collection(Brand::onlyTrashed()->orderByDesc('deleted_at')->orderByDesc('id')->paginate(10));
    }

    /** GET /api/admin/brands/trash/{id} — fetch a deleted brand. */
    public function trashedShow(int $id): BrandResource
    {
        return new BrandResource(Brand::onlyTrashed()->findOrFail($id));
    }

    /** GET /api/admin/brands/options — compact active brand options for forms. */
    public function options(): JsonResponse
    {
        return response()->json(['data' => Brand::query()->orderBy('name')->orderBy('id')->get(['id', 'name'])]);
    }

    /** POST /api/admin/brands — validate and create a brand (201). */
    public function store(StoreBrandRequest $request): JsonResponse
    {
        $brand = Brand::create($request->validated());

        return (new BrandResource($brand))->response()->setStatusCode(201);
    }

    /** GET /api/admin/brands/{brand} — fetch one active brand for editing. */
    public function show(Brand $brand): BrandResource
    {
        return new BrandResource($brand);
    }

    /** PUT/PATCH /api/admin/brands/{brand} — validate and update a brand. */
    public function update(UpdateBrandRequest $request, Brand $brand): BrandResource
    {
        $brand->update($request->validated());

        return new BrandResource($brand->fresh());
    }

    /** DELETE /api/admin/brands/{brand} — move to trash when no active products depend on it. */
    public function destroy(Brand $brand): JsonResponse
    {
        if ($brand->products()->exists()) {
            return response()->json(['message' => 'Thương hiệu này vẫn có sản phẩm.'], 409);
        }
        $brand->delete();

        return response()->json(['message' => 'Đã chuyển thương hiệu vào thùng rác.']);
    }

    /** POST /api/admin/brands/{id}/restore — restore a soft-deleted brand. */
    public function restore(int $id): JsonResponse|BrandResource
    {
        $brand = Brand::onlyTrashed()->findOrFail($id);
        $brand->restore();

        return new BrandResource($brand->fresh());
    }

    /** DELETE /api/admin/brands/{id}/force — permanently delete if no product history depends on it. */
    public function forceDestroy(int $id): JsonResponse
    {
        $brand = Brand::onlyTrashed()->findOrFail($id);

        if ($brand->products()->withTrashed()->exists()) {
            return response()->json(['message' => 'Thương hiệu này có lịch sử sản phẩm nên không thể xóa vĩnh viễn.'], 409);
        }

        $brand->forceDelete();

        return response()->json(['message' => 'Đã xóa vĩnh viễn thương hiệu.']);
    }
}
