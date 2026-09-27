<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        $query = Product::query()->with(['category', 'brand', 'defaultVariant', 'images']);

        if ($request->filled('q')) {
            $query->where('name', 'like', '%'.$request->string('q')->trim()->toString().'%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($categoryQuery) => $categoryQuery->where('slug', $request->string('category')));
        }

        if ($request->filled('brand')) {
            $query->whereHas('brand', fn ($brandQuery) => $brandQuery->where('slug', $request->string('brand')));
        }

        return $this->successPaginated($query->latest()->paginate((int) $request->integer('per_page', 15)), ProductResource::class);
    }

    public function show(Product $product): JsonResponse
    {
        return $this->success(new ProductResource($product->load(['category', 'brand', 'defaultVariant', 'variants', 'images'])));
    }

    public function export(Request $request): StreamedResponse
    {
        $query = Product::query()->with(['category', 'brand', 'variants', 'primaryImage'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->streamDownload(function () use ($query): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['name', 'slug', 'category', 'brand', 'status', 'featured', 'sku', 'variant', 'price', 'sale_price', 'stock', 'image']);

            $query->chunk(100, function ($products) use ($handle): void {
                foreach ($products as $product) {
                    foreach ($product->variants as $variant) {
                        fputcsv($handle, [
                            $product->name,
                            $product->slug,
                            $product->category?->name,
                            $product->brand?->name,
                            $product->status,
                            $product->featured ? 'yes' : 'no',
                            $variant->sku,
                            $variant->name,
                            $variant->price,
                            $variant->sale_price,
                            $variant->stock_quantity,
                            $product->primaryImage?->path,
                        ]);
                    }
                }
            });

            fclose($handle);
        }, 'products.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function store(StoreProductRequest $request, ProductService $productService): JsonResponse
    {
        $product = $productService->create($request->validated());

        return $this->success(new ProductResource($product), 'Đã tạo sản phẩm.', status: 201);
    }

    public function update(UpdateProductRequest $request, Product $product, ProductService $productService): JsonResponse
    {
        $product = $productService->update($product, $request->validated());

        return $this->success(new ProductResource($product), 'Đã cập nhật sản phẩm.');
    }

    public function destroy(Product $product): JsonResponse
    {
        if (OrderItem::query()->where('product_id', $product->id)->exists()) {
            $product->update(['status' => 'inactive']);
            $product->delete();

            return $this->success(null, 'Sản phẩm đã có giao dịch nên đã được ẩn khỏi cửa hàng.');
        }

        $product->delete();

        return $this->success(null, 'Đã xóa sản phẩm.');
    }
}
