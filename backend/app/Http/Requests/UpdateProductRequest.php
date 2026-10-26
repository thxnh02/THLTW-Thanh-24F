<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ResolvesCatalogSlug;
use App\Models\Product;
use App\Rules\UniqueCatalogName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Validation boundary for PUT/PATCH /api/admin/products/{product}. */
class UpdateProductRequest extends FormRequest
{
    use ResolvesCatalogSlug;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $product = $this->route('product');
        $this->normalizeCatalogName();
        $this->resolveCatalogSlug(Product::class, 200, $product instanceof Product ? $product->id : null);
    }

    public function rules(): array
    {
        $product = $this->route('product');

        return [
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')->whereNull('deleted_at')],
            'brand_id' => ['nullable', 'integer', Rule::exists('brands', 'id')->whereNull('deleted_at')],
            'name' => ['required', 'string', 'max:180', new UniqueCatalogName(Product::class, $product instanceof Product ? $product->id : null)],
            'slug' => ['required', 'string', 'max:200', Rule::unique('products', 'slug')->ignore($product)],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:255'],
            'image_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:2048'],
            'price' => ['required', 'numeric', 'decimal:0,2', 'min:0', 'max:9999999999.99'],
            'sale_price' => ['nullable', 'numeric', 'decimal:0,2', 'min:0', 'max:9999999999.99', 'lt:price'],
            'status' => ['required', 'boolean'],
        ];
    }
}
