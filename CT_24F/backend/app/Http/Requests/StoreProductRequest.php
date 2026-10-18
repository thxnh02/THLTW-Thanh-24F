<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ResolvesCatalogSlug;
use App\Models\Product;
use App\Rules\UniqueCatalogName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Validation boundary for POST /api/admin/products before AdminProductController::store(). */
class StoreProductRequest extends FormRequest
{
    use ResolvesCatalogSlug;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeCatalogName();
        $this->resolveCatalogSlug(Product::class, 200);
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')->whereNull('deleted_at')],
            'brand_id' => ['nullable', 'integer', Rule::exists('brands', 'id')->whereNull('deleted_at')],
            'name' => ['required', 'string', 'max:180', new UniqueCatalogName(Product::class)],
            'slug' => ['required', 'string', 'max:200', 'unique:products,slug'],
            'sku' => ['nullable', 'string', 'max:60', 'unique:products,sku'],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'is_featured' => ['nullable', 'boolean'],
            'short_description' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:255'],
            'image_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:2048'],
            'price' => ['required', 'numeric', 'decimal:0,2', 'min:0', 'max:9999999999.99'],
            'sale_price' => ['nullable', 'numeric', 'decimal:0,2', 'min:0', 'max:9999999999.99', 'lt:price'],
            'status' => ['required', 'boolean'],
        ];
    }
}
