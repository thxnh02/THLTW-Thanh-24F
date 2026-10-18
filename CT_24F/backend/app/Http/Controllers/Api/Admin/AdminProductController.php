<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Services\CatalogImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class AdminProductController extends Controller
{
    /** GET /api/admin/products */
    public function index(): AnonymousResourceCollection
    {
        return ProductResource::collection($this->filtered(Product::with(['category', 'brand']))->paginate($this->perPage())->withQueryString());
    }

    private function perPage(): int
    {
        $perPage = (int) request()->query('per_page', 10);

        return in_array($perPage, [5, 10, 20], true) ? $perPage : 10;
    }

    private function filtered($query)
    {
        $keyword = trim((string) request()->query('keyword', request()->query('q', '')));
        if ($keyword !== '') {
            $query->where(fn ($q) => $q->where('name', 'like', '%'.$keyword.'%')
                ->orWhere('sku', 'like', '%'.$keyword.'%'));
        }
        if (request()->filled('category_id')) {
            $query->where('category_id', (int) request()->query('category_id'));
        }

        return $query->orderByDesc('id');
    }

    /** POST /api/admin/products */
    public function store(StoreProductRequest $request, CatalogImageService $images): JsonResponse
    {
        $product = DB::transaction(function () use ($request, $images): Product {
            $product = Product::create(Arr::except($request->validated(), ['image_file']));
            $images->sync($product, 'image', $request->file('image_file'));

            return $product;
        });

        return (new ProductResource($product->load(['category', 'brand'])))->response()->setStatusCode(201);
    }

    /** GET /api/admin/products/{product} */
    public function show(Product $product): ProductResource
    {
        return new ProductResource($product->load(['category', 'brand']));
    }

    /** PUT/PATCH /api/admin/products/{product} */
    public function update(UpdateProductRequest $request, Product $product, CatalogImageService $images): ProductResource
    {
        DB::transaction(function () use ($request, $product, $images): void {
            $product->update(Arr::except($request->validated(), ['image_file']));
            $images->sync($product, 'image', $request->file('image_file'));
        });

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
        return ProductResource::collection($this->filtered(Product::onlyTrashed()->with(['category', 'brand']))->paginate($this->perPage())->withQueryString());
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
    public function forceDestroy(int $id, CatalogImageService $images): JsonResponse
    {
        $product = Product::onlyTrashed()->findOrFail($id);
        DB::transaction(function () use ($product, $images): void {
            $images->deleteFor($product);
            $product->forceDelete();
        });

        return response()->json(['message' => 'Đã xóa vĩnh viễn sản phẩm.']);
    }
}
