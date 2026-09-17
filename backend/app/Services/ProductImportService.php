<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductImportService
{
    /**
     * @return array<string, mixed>
     */
    public function preview(UploadedFile $file, string $mode): array
    {
        return $this->analyze($file, $mode, false);
    }

    /**
     * @return array<string, mixed>
     */
    public function import(UploadedFile $file, string $mode): array
    {
        return $this->analyze($file, $mode, true);
    }

    /**
     * @return array<string, mixed>
     */
    private function analyze(UploadedFile $file, string $mode, bool $persist): array
    {
        $rows = $this->readRows($file);
        $seenSkus = [];
        $results = [];
        $validRows = [];

        foreach ($rows as $index => $row) {
            $errors = $this->validateRow($row, $mode, $seenSkus);

            if ($errors === []) {
                $validRows[] = $row;
            }

            $results[] = [
                'line' => $index + 2,
                'sku' => $row['sku'] ?? '',
                'errors' => $errors,
            ];

            if (($row['sku'] ?? '') !== '') {
                $seenSkus[] = strtoupper(trim($row['sku']));
            }
        }

        $imported = 0;

        if ($persist && collect($results)->every(fn (array $result): bool => $result['errors'] === [])) {
            DB::transaction(function () use ($validRows, $mode, &$imported): void {
                foreach ($validRows as $row) {
                    $this->persistRow($row, $mode);
                    $imported++;
                }
            });
        }

        return [
            'total' => count($rows),
            'valid' => count($validRows),
            'invalid' => count($rows) - count($validRows),
            'imported' => $imported,
            'rows' => $results,
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function readRows(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');

        if (! $handle) {
            abort(422, 'Khong the doc file CSV.');
        }

        $headers = array_map(fn (string $header): string => Str::snake(trim($header)), fgetcsv($handle) ?: []);
        $rows = [];

        while (($values = fgetcsv($handle)) !== false) {
            if (count(array_filter($values, fn ($value): bool => trim((string) $value) !== '')) === 0) {
                continue;
            }

            $rows[] = array_combine($headers, array_pad($values, count($headers), '')) ?: [];
        }

        fclose($handle);

        return $rows;
    }

    /**
     * @param  array<int, string>  $seenSkus
     * @return array<int, string>
     */
    private function validateRow(array $row, string $mode, array $seenSkus): array
    {
        $errors = [];
        $sku = strtoupper(trim($row['sku'] ?? ''));
        $price = (float) ($row['price'] ?? -1);
        $salePrice = trim((string) ($row['sale_price'] ?? '')) === '' ? null : (float) $row['sale_price'];
        $stock = (int) ($row['stock'] ?? -1);

        foreach (['product_name', 'category', 'sku', 'variant_name', 'price', 'stock'] as $field) {
            if (trim((string) ($row[$field] ?? '')) === '') {
                $errors[] = $field.' la bat buoc.';
            }
        }

        if ($sku !== '' && in_array($sku, $seenSkus, true)) {
            $errors[] = 'SKU bi trung trong file.';
        }

        $existingVariant = $sku === '' ? null : ProductVariant::query()->where('sku', $sku)->first();

        if ($mode === 'create' && $existingVariant) {
            $errors[] = 'SKU da ton tai trong he thong.';
        }

        if ($mode === 'update' && ! $existingVariant) {
            $errors[] = 'SKU khong ton tai de cap nhat.';
        }

        if ($price < 0) {
            $errors[] = 'Gia phai >= 0.';
        }

        if ($salePrice !== null && $salePrice > $price) {
            $errors[] = 'Gia sale khong duoc lon hon gia goc.';
        }

        if ($stock < 0) {
            $errors[] = 'Ton kho phai >= 0.';
        }

        if (! $this->findCategory($row['category'] ?? null)) {
            $errors[] = 'Danh muc khong ton tai.';
        }

        if (trim((string) ($row['brand'] ?? '')) !== '' && ! $this->findBrand($row['brand'])) {
            $errors[] = 'Thuong hieu khong ton tai.';
        }

        return $errors;
    }

    private function persistRow(array $row, string $mode): void
    {
        $sku = strtoupper(trim($row['sku']));
        $category = $this->findCategory($row['category']);
        $brand = $this->findBrand($row['brand'] ?? null);
        $variant = ProductVariant::query()->where('sku', $sku)->first();
        $product = $variant?->product ?: Product::query()->firstOrCreate(
            ['slug' => ($row['slug'] ?? '') ?: Str::slug($row['product_name'])],
            [
                'category_id' => $category->id,
                'brand_id' => $brand?->id,
                'name' => $row['product_name'],
                'short_description' => $row['short_description'] ?? null,
                'description' => $row['description'] ?? null,
                'status' => ($row['status'] ?? '') ?: 'active',
                'featured' => in_array(strtolower((string) ($row['featured'] ?? '')), ['1', 'yes', 'true'], true),
            ],
        );

        if ($mode !== 'update') {
            $product->update([
                'category_id' => $category->id,
                'brand_id' => $brand?->id,
                'name' => $row['product_name'],
                'short_description' => $row['short_description'] ?? null,
                'description' => $row['description'] ?? null,
                'status' => ($row['status'] ?? '') ?: 'active',
                'featured' => in_array(strtolower((string) ($row['featured'] ?? '')), ['1', 'yes', 'true'], true),
            ]);
        }

        ProductVariant::query()->updateOrCreate(
            ['sku' => $sku],
            [
                'product_id' => $product->id,
                'name' => ($row['variant_name'] ?? '') ?: 'Default',
                'price' => (float) $row['price'],
                'sale_price' => trim((string) ($row['sale_price'] ?? '')) === '' ? null : (float) $row['sale_price'],
                'stock_quantity' => (int) $row['stock'],
                'active' => (($row['status'] ?? 'active') !== 'inactive'),
                'is_default' => ! ProductVariant::query()->where('product_id', $product->id)->where('sku', '!=', $sku)->exists(),
            ],
        );

        if (trim((string) ($row['image'] ?? '')) !== '' && ! $product->images()->where('path', $row['image'])->exists()) {
            ProductImage::create([
                'product_id' => $product->id,
                'path' => $row['image'],
                'alt_text' => $product->name,
                'is_primary' => ! $product->images()->exists(),
                'sort_order' => $product->images()->count() + 1,
            ]);
        }
    }

    private function findCategory(?string $value): ?Category
    {
        $needle = trim((string) $value);

        return $needle === ''
            ? null
            : Category::query()->where('slug', Str::slug($needle))->orWhere('name', $needle)->first();
    }

    private function findBrand(?string $value): ?Brand
    {
        $needle = trim((string) $value);

        return $needle === ''
            ? null
            : Brand::query()->where('slug', Str::slug($needle))->orWhere('name', $needle)->first();
    }
}
