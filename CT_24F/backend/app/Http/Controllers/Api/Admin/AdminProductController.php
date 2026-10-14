<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminProductController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return ProductResource::collection(Product::with(['category', 'brand'])->orderByDesc('id')->paginate(10));
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = Product::create($request->validated());

        return (new ProductResource($product->load(['category', 'brand'])))->response()->setStatusCode(201);
    }

    public function show(Product $product): ProductResource
    {
        return new ProductResource($product->load(['category', 'brand']));
    }

    public function update(UpdateProductRequest $request, Product $product): ProductResource
    {
        $product->update($request->validated());

        return new ProductResource($product->fresh()->load(['category', 'brand']));
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['message' => 'Product moved to trash.']);
    }

    public function trash(): AnonymousResourceCollection
    {
        return ProductResource::collection(Product::onlyTrashed()->with(['category', 'brand'])->orderByDesc('deleted_at')->orderByDesc('id')->paginate(10));
    }

    public function trashedShow(int $id): ProductResource
    {
        return new ProductResource(Product::onlyTrashed()->with(['category', 'brand'])->findOrFail($id));
    }

    public function restore(int $id): JsonResponse|ProductResource
    {
        $product = Product::onlyTrashed()->findOrFail($id);

        if (! Category::query()->whereKey($product->category_id)->exists()) {
            return response()->json(['message' => 'Restore the product category before restoring this product.'], 409);
        }
        if ($product->brand_id !== null && ! Brand::query()->whereKey($product->brand_id)->exists()) {
            return response()->json(['message' => 'Restore the product brand before restoring this product.'], 409);
        }

        $product->restore();

        return new ProductResource($product->fresh()->load(['category', 'brand']));
    }

    public function forceDestroy(int $id): JsonResponse
    {
        $product = Product::onlyTrashed()->findOrFail($id);
        $product->forceDelete();

        return response()->json(['message' => 'Product permanently deleted.']);
    }
}
