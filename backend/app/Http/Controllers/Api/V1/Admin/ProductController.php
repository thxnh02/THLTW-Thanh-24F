<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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

        return $this->success($query->latest()->paginate((int) $request->integer('per_page', 15)));
    }

    public function show(Product $product): JsonResponse
    {
        return $this->success($product->load(['category', 'brand', 'variants', 'images']));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatedProduct($request);

        $product = DB::transaction(function () use ($validated): Product {
            $product = Product::create([
                'category_id' => $validated['category_id'],
                'brand_id' => $validated['brand_id'] ?? null,
                'name' => $validated['name'],
                'slug' => $validated['slug'] ?? Str::slug($validated['name']),
                'short_description' => $validated['short_description'] ?? null,
                'description' => $validated['description'] ?? null,
                'status' => $validated['status'],
                'featured' => $validated['featured'] ?? false,
                'seo_title' => $validated['seo_title'] ?? null,
                'seo_description' => $validated['seo_description'] ?? null,
            ]);

            $this->syncVariants($product, $validated['variants']);
            $this->syncImages($product, $validated['images'] ?? []);

            return $product->load(['category', 'brand', 'variants', 'images']);
        });

        return $this->success($product, 'Da tao san pham.', status: 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $this->validatedProduct($request, $product);

        $product = DB::transaction(function () use ($product, $validated): Product {
            $product->update([
                'category_id' => $validated['category_id'],
                'brand_id' => $validated['brand_id'] ?? null,
                'name' => $validated['name'],
                'slug' => $validated['slug'] ?? Str::slug($validated['name']),
                'short_description' => $validated['short_description'] ?? null,
                'description' => $validated['description'] ?? null,
                'status' => $validated['status'],
                'featured' => $validated['featured'] ?? false,
                'seo_title' => $validated['seo_title'] ?? null,
                'seo_description' => $validated['seo_description'] ?? null,
            ]);

            $this->syncVariants($product, $validated['variants']);
            $this->syncImages($product, $validated['images'] ?? []);

            return $product->refresh()->load(['category', 'brand', 'variants', 'images']);
        });

        return $this->success($product, 'Da cap nhat san pham.');
    }

    public function destroy(Product $product): JsonResponse
    {
        if (OrderItem::query()->where('product_id', $product->id)->exists()) {
            $product->update(['status' => 'inactive']);
            $product->delete();

            return $this->success(null, 'San pham da co giao dich nen da duoc an bang soft delete.');
        }

        $product->delete();

        return $this->success(null, 'Da xoa san pham.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedProduct(Request $request, ?Product $product = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'slug' => ['nullable', 'string', 'max:200', Rule::unique('products', 'slug')->ignore($product?->id)],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'short_description' => ['nullable', 'string', 'max:2000'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:active,inactive,draft'],
            'featured' => ['nullable', 'boolean'],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string', 'max:255'],
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'variants.*.sku' => ['required', 'string', 'max:120'],
            'variants.*.name' => ['required', 'string', 'max:160'],
            'variants.*.attributes' => ['nullable', 'array'],
            'variants.*.price' => ['required', 'numeric', 'min:0'],
            'variants.*.sale_price' => ['nullable', 'numeric', 'min:0', 'lte:variants.*.price'],
            'variants.*.stock_quantity' => ['required', 'integer', 'min:0'],
            'variants.*.active' => ['nullable', 'boolean'],
            'variants.*.is_default' => ['nullable', 'boolean'],
            'images' => ['nullable', 'array'],
            'images.*.path' => ['required', 'string', 'max:255'],
            'images.*.alt_text' => ['nullable', 'string', 'max:255'],
            'images.*.is_primary' => ['nullable', 'boolean'],
            'images.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $variants
     */
    private function syncVariants(Product $product, array $variants): void
    {
        $keptVariantIds = [];
        $hasDefault = collect($variants)->contains(fn (array $variant): bool => (bool) ($variant['is_default'] ?? false));

        foreach ($variants as $index => $variantData) {
            $skuQuery = ProductVariant::query()->where('sku', $variantData['sku']);

            if (isset($variantData['id'])) {
                $skuQuery->where('id', '!=', $variantData['id']);
            }

            if ($skuQuery->exists()) {
                abort(422, 'SKU da ton tai: '.$variantData['sku']);
            }

            $variant = ProductVariant::query()->updateOrCreate(
                [
                    'id' => $variantData['id'] ?? null,
                    'product_id' => $product->id,
                ],
                [
                    'product_id' => $product->id,
                    'sku' => $variantData['sku'],
                    'name' => $variantData['name'],
                    'attributes' => $variantData['attributes'] ?? null,
                    'price' => $variantData['price'],
                    'sale_price' => $variantData['sale_price'] ?? null,
                    'stock_quantity' => $variantData['stock_quantity'],
                    'active' => $variantData['active'] ?? true,
                    'is_default' => $hasDefault ? (bool) ($variantData['is_default'] ?? false) : $index === 0,
                ],
            );
            $keptVariantIds[] = $variant->id;
        }

        ProductVariant::query()
            ->where('product_id', $product->id)
            ->whereNotIn('id', $keptVariantIds)
            ->delete();
    }

    /**
     * @param  array<int, array<string, mixed>>  $images
     */
    private function syncImages(Product $product, array $images): void
    {
        ProductImage::query()->where('product_id', $product->id)->delete();

        foreach ($images as $index => $imageData) {
            ProductImage::create([
                'product_id' => $product->id,
                'path' => $imageData['path'],
                'alt_text' => $imageData['alt_text'] ?? $product->name,
                'is_primary' => $imageData['is_primary'] ?? $index === 0,
                'sort_order' => $imageData['sort_order'] ?? $index + 1,
            ]);
        }
    }
}
