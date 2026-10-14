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
    /** GET /api/admin/products */
    public function index(): AnonymousResourceCollection
    {
        return ProductResource::collection(Product::with(['category', 'brand'])->orderByDesc('id')->paginate(10));
    }

    /** POST /api/admin/products */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = Product::create($request->validated());

        return (new ProductResource($product->load(['category', 'brand'])))->response()->setStatusCode(201);
    }

    /** GET /api/admin/products/{product} */
    public function show(Product $product): ProductResource
    {
        return new ProductResource($product->load(['category', 'brand']));
    }

    /** PUT/PATCH /api/admin/products/{product} */
    public function update(UpdateProductRequest $request, Product $product): ProductResource
    {
        $product->update($request->validated());

        return new ProductResource($product->fresh()->load(['category', 'brand']));
    }

    /** DELETE /api/admin/products/{product} — soft-delete; the product remains restorable. */
    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['message' => 'Đã chuyển sản phẩm vào thùng rác.']);
    }

    /** GET /api/admin/products/trash — paginated products that were soft-deleted. */
    public function trash(): AnonymousResourceCollection
    {
        return ProductResource::collection(Product::onlyTrashed()->with(['category', 'brand'])->orderByDesc('deleted_at')->orderByDesc('id')->paginate(10));
    }

    /** GET /api/admin/products/trash/{id} */
    public function trashedShow(int $id): ProductResource
    {
        return new ProductResource(Product::onlyTrashed()->with(['category', 'brand'])->findOrFail($id));
    }

    /** POST /api/admin/products/{id}/restore — restore only when its category/brand exist. */
    public function restore(int $id): JsonResponse|ProductResource
    {
        $product = Product::onlyTrashed()->findOrFail($id);

        if (! Category::query()->whereKey($product->category_id)->exists()) {
            return response()->json(['message' => 'Hãy khôi phục danh mục trước khi khôi phục sản phẩm này.'], 409);
        }
        if ($product->brand_id !== null && ! Brand::query()->whereKey($product->brand_id)->exists()) {
            return response()->json(['message' => 'Hãy khôi phục thương hiệu trước khi khôi phục sản phẩm này.'], 409);
        }

        $product->restore();

        return new ProductResource($product->fresh()->load(['category', 'brand']));
    }

    /** DELETE /api/admin/products/{id}/force — permanently remove a trashed product. */
    public function forceDestroy(int $id): JsonResponse
    {
        $product = Product::onlyTrashed()->findOrFail($id);
        $product->forceDelete();

        return response()->json(['message' => 'Đã xóa vĩnh viễn sản phẩm.']);
    }
}
