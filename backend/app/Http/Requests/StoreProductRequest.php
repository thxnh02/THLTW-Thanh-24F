<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:180'],
            'slug' => ['nullable', 'string', 'max:200', 'unique:products,slug'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'short_description' => ['nullable', 'string', 'max:2000'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:active,inactive,draft'],
            'featured' => ['nullable', 'boolean'],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string', 'max:255'],
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.id' => ['prohibited'],
            'variants.*.sku' => ['required', 'string', 'max:120'],
            'variants.*.name' => ['required', 'string', 'max:160'],
            'variants.*.attributes' => ['nullable', 'array'],
            'variants.*.price' => ['required', 'numeric', 'min:0'],
            'variants.*.sale_price' => ['nullable', 'numeric', 'min:0', 'lte:variants.*.price'],
            'variants.*.stock_quantity' => ['required', 'integer', 'min:0'],
            'variants.*.active' => ['nullable', 'boolean'],
            'variants.*.is_default' => ['nullable', 'boolean'],
            'deleted_variant_ids' => ['nullable', 'array'],
            'deleted_variant_ids.*' => ['integer', 'exists:product_variants,id'],
            'images' => ['nullable', 'array'],
            'images.*.id' => ['prohibited'],
            'images.*.path' => ['required', 'string', 'max:255'],
            'images.*.alt_text' => ['nullable', 'string', 'max:255'],
            'images.*.is_primary' => ['nullable', 'boolean'],
            'images.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'deleted_image_ids' => ['prohibited'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['slug' => $this->filled('slug') ? $this->input('slug') : Str::slug((string) $this->input('name'))]);
    }
}
