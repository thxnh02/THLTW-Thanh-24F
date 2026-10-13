<?php

namespace App\Services;

use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductService
{
    /** @param array<string, mixed> $validated */
    public function create(array $validated): Product
    {
        return DB::transaction(function () use ($validated): Product {
            $product = Product::create($this->productAttributes($validated));
            $this->syncVariants($product, $validated['variants']);
            $this->syncImages($product, $validated['images'] ?? [], true);

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

            if (array_key_exists('images', $validated) || array_key_exists('deleted_image_ids', $validated)) {
                $this->syncImages($product, $validated['images'] ?? [], false, $validated['deleted_image_ids'] ?? []);
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
        $existingDefaultId = $product->variants()->where('is_default', true)->value('id');
        $explicitDefault = collect($variants)->first(fn (array $variant): bool => (bool) ($variant['is_default'] ?? false));
        $preservedDefaultId = $explicitDefault === null ? $existingDefaultId : null;
        $defaultAssigned = false;

        $product->variants()->update(['is_default' => false]);

        foreach ($variants as $index => $variantData) {
            $skuQuery = ProductVariant::query()->where('sku', $variantData['sku']);

            if (isset($variantData['id'])) {
                $skuQuery->where('id', '!=', $variantData['id']);
            }

            if ($skuQuery->exists()) {
                throw ValidationException::withMessages([
                    'variants.'.$index.'.sku' => ['SKU đã tồn tại: '.$variantData['sku']],
                ]);
            }

            if (isset($variantData['id']) && ! ProductVariant::query()->whereKey($variantData['id'])->where('product_id', $product->id)->exists()) {
                throw ValidationException::withMessages([
                    'variants.'.$index.'.id' => ['Biến thể không thuộc sản phẩm này.'],
                ]);
            }

            $isExplicitDefault = (bool) ($variantData['is_default'] ?? false) && ! $defaultAssigned;
            $isPreservedDefault = $preservedDefaultId !== null && (int) ($variantData['id'] ?? 0) === (int) $preservedDefaultId;
            $isDefault = $isExplicitDefault || $isPreservedDefault;
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

        if (! $defaultAssigned && $preservedDefaultId !== null) {
            $preserved = $product->variants()->whereKey($preservedDefaultId)->first();
            if ($preserved) {
                $preserved->update(['is_default' => true]);
                $defaultAssigned = true;
            }
        }

        if (! $defaultAssigned) {
            $fallback = $product->variants()->oldest('id')->first();
            $fallback?->update(['is_default' => true]);
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
            abort(422, 'Chỉ có thể xóa biến thể của sản phẩm này.');
        }

        if (OrderItem::query()->whereIn('product_variant_id', $variants->modelKeys())->exists()) {
            abort(409, 'Biến thể đã có trong đơn hàng nên không thể xóa.');
        }

        $variants->each->delete();
    }

    /** @param array<int, array<string, mixed>> $images */
    private function syncImages(Product $product, array $images, bool $isCreate, array $deletedImageIds = []): void
    {
        if ($isCreate) {
            foreach ($images as $index => $imageData) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'path' => $imageData['path'],
                    'alt_text' => $imageData['alt_text'] ?? $product->name,
                    'is_primary' => false,
                    'sort_order' => $imageData['sort_order'] ?? $index + 1,
                ]);
            }
        } else {
            $this->deleteExplicitImages($product, $deletedImageIds);

            foreach ($images as $index => $imageData) {
                if (isset($imageData['id'])) {
                    $image = ProductImage::query()->find($imageData['id']);
                    if (! $image || $image->product_id !== $product->id) {
                        throw ValidationException::withMessages([
                            'images.'.$index.'.id' => ['Ảnh không thuộc sản phẩm này.'],
                        ]);
                    }
                } else {
                    $image = new ProductImage(['product_id' => $product->id]);
                }
                $image->fill([
                    'path' => $imageData['path'],
                    'alt_text' => $imageData['alt_text'] ?? $product->name,
                    'sort_order' => $imageData['sort_order'] ?? $index + 1,
                ]);
                $image->save();
            }
        }

        $allImages = $product->images()->get();
        if ($allImages->isEmpty()) {
            return;
        }

        $requestedPrimary = collect($images)->first(fn (array $image): bool => (bool) ($image['is_primary'] ?? false));
        $primary = $requestedPrimary
            ? (isset($requestedPrimary['id'])
                ? $allImages->firstWhere('id', $requestedPrimary['id'])
                : $allImages->where('path', $requestedPrimary['path'])->sortByDesc('id')->first())
            : $allImages->firstWhere('is_primary', true) ?? $allImages->first();
        $primary ??= $allImages->first();
        $allImages->each(fn (ProductImage $image) => $image->update(['is_primary' => $image->is($primary)]));
    }

    /** @param array<int, int> $imageIds */
    private function deleteExplicitImages(Product $product, array $imageIds): void
    {
        if ($imageIds === []) {
            return;
        }

        $images = ProductImage::query()->whereIn('id', $imageIds)->get();
        if ($images->count() !== count(array_unique($imageIds)) || $images->contains(fn (ProductImage $image): bool => $image->product_id !== $product->id)) {
            throw ValidationException::withMessages([
                'deleted_image_ids' => ['Chỉ có thể xóa ảnh của sản phẩm này.'],
            ]);
        }

        $images->each->delete();
    }
}
