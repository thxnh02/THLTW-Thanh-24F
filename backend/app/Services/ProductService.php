<?php

namespace App\Services;

use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductService
{
    /** @param array<string, mixed> $validated */
    public function create(array $validated): Product
    {
        return DB::transaction(function () use ($validated): Product {
            $product = Product::create($this->productAttributes($validated));
            $this->syncVariants($product, $validated['variants']);
            $this->syncImages($product, $validated['images'] ?? []);

            return $product->load(['category', 'brand', 'variants', 'images']);
        });
    }

    /** @param array<string, mixed> $validated */
    public function update(Product $product, array $validated): Product
    {
        return DB::transaction(function () use ($product, $validated): Product {
            $product->update($this->productAttributes($validated));
            $this->deleteExplicitVariants($product, $validated['deleted_variant_ids'] ?? []);
            $this->syncVariants($product, $validated['variants']);

            if (array_key_exists('images', $validated)) {
                $this->syncImages($product, $validated['images']);
            }

            return $product->refresh()->load(['category', 'brand', 'variants', 'images']);
        });
    }

    /** @param array<string, mixed> $validated */
    private function productAttributes(array $validated): array
    {
        return [
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
        ];
    }

    /** @param array<int, array<string, mixed>> $variants */
    private function syncVariants(Product $product, array $variants): void
    {
        $hasDefault = collect($variants)->contains(fn (array $variant): bool => (bool) ($variant['is_default'] ?? false));
        $defaultAssigned = false;

        foreach ($variants as $index => $variantData) {
            $skuQuery = ProductVariant::query()->where('sku', $variantData['sku']);

            if (isset($variantData['id'])) {
                $skuQuery->where('id', '!=', $variantData['id']);
            }

            if ($skuQuery->exists()) {
                abort(422, 'SKU da ton tai: '.$variantData['sku']);
            }

            if (isset($variantData['id']) && ! ProductVariant::query()->whereKey($variantData['id'])->where('product_id', $product->id)->exists()) {
                abort(422, 'Variant khong thuoc san pham nay.');
            }

            $isDefault = $hasDefault
                ? (bool) ($variantData['is_default'] ?? false) && ! $defaultAssigned
                : $index === 0;
            $defaultAssigned = $defaultAssigned || $isDefault;

            ProductVariant::query()->updateOrCreate(
                ['id' => $variantData['id'] ?? null, 'product_id' => $product->id],
                [
                    'product_id' => $product->id,
                    'sku' => $variantData['sku'],
                    'name' => $variantData['name'],
                    'attributes' => $variantData['attributes'] ?? null,
                    'price' => $variantData['price'],
                    'sale_price' => $variantData['sale_price'] ?? null,
                    'stock_quantity' => $variantData['stock_quantity'],
                    'active' => $variantData['active'] ?? true,
                    'is_default' => $isDefault,
                ],
            );
        }
    }

    /** @param array<int, int> $variantIds */
    private function deleteExplicitVariants(Product $product, array $variantIds): void
    {
        if ($variantIds === []) {
            return;
        }

        $variants = ProductVariant::query()
            ->where('product_id', $product->id)
            ->whereIn('id', $variantIds)
            ->get();

        if ($variants->count() !== count(array_unique($variantIds))) {
            abort(422, 'Chi co the xoa variant cua san pham nay.');
        }

        if (OrderItem::query()->whereIn('product_variant_id', $variants->modelKeys())->exists()) {
            abort(409, 'Variant da co trong don hang nen khong the xoa.');
        }

        $variants->each->delete();
    }

    /** @param array<int, array<string, mixed>> $images */
    private function syncImages(Product $product, array $images): void
    {
        ProductImage::query()->where('product_id', $product->id)->delete();

        $hasPrimary = collect($images)->contains(fn (array $image): bool => (bool) ($image['is_primary'] ?? false));
        $primaryAssigned = false;

        foreach ($images as $index => $imageData) {
            $isPrimary = $hasPrimary
                ? (bool) ($imageData['is_primary'] ?? false) && ! $primaryAssigned
                : $index === 0;
            $primaryAssigned = $primaryAssigned || $isPrimary;

            ProductImage::create([
                'product_id' => $product->id,
                'path' => $imageData['path'],
                'alt_text' => $imageData['alt_text'] ?? $product->name,
                'is_primary' => $isPrimary,
                'sort_order' => $imageData['sort_order'] ?? $index + 1,
            ]);
        }
    }
}
