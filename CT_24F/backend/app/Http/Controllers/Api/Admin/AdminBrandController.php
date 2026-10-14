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
    public function index(): AnonymousResourceCollection
    {
        return BrandResource::collection(Brand::orderBy('sort_order')->orderBy('id')->paginate(10));
    }

    public function trash(): AnonymousResourceCollection
    {
        return BrandResource::collection(Brand::onlyTrashed()->orderByDesc('deleted_at')->orderByDesc('id')->paginate(10));
    }

    public function trashedShow(int $id): BrandResource
    {
        return new BrandResource(Brand::onlyTrashed()->findOrFail($id));
    }

    public function options(): JsonResponse
    {
        return response()->json(['data' => Brand::query()->orderBy('name')->orderBy('id')->get(['id', 'name'])]);
    }

    public function store(StoreBrandRequest $request): JsonResponse
    {
        $brand = Brand::create($request->validated());

        return (new BrandResource($brand))->response()->setStatusCode(201);
    }

    public function show(Brand $brand): BrandResource
    {
        return new BrandResource($brand);
    }

    public function update(UpdateBrandRequest $request, Brand $brand): BrandResource
    {
        $brand->update($request->validated());

        return new BrandResource($brand->fresh());
    }

    public function destroy(Brand $brand): JsonResponse
    {
        if ($brand->products()->exists()) {
            return response()->json(['message' => 'This brand still has products.'], 409);
        }
        $brand->delete();

        return response()->json(['message' => 'Brand moved to trash.']);
    }

    public function restore(int $id): JsonResponse|BrandResource
    {
        $brand = Brand::onlyTrashed()->findOrFail($id);
        $brand->restore();

        return new BrandResource($brand->fresh());
    }

    public function forceDestroy(int $id): JsonResponse
    {
        $brand = Brand::onlyTrashed()->findOrFail($id);

        if ($brand->products()->withTrashed()->exists()) {
            return response()->json(['message' => 'This brand has product history and cannot be permanently deleted.'], 409);
        }

        $brand->forceDelete();

        return response()->json(['message' => 'Brand permanently deleted.']);
    }
}
