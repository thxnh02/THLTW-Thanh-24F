<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ResolvesCatalogSlug;
use App\Models\Brand;
use App\Rules\UniqueCatalogName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBrandRequest extends FormRequest
{
    use ResolvesCatalogSlug;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $brand = $this->route('brand');
        $this->normalizeCatalogName();
        $this->resolveCatalogSlug(Brand::class, 170, $brand instanceof Brand ? $brand->id : null);
    }

    public function rules(): array
    {
        $brand = $this->route('brand');

        return ['name' => ['required', 'string', 'max:150', new UniqueCatalogName(Brand::class, $brand instanceof Brand ? $brand->id : null)], 'slug' => ['required', 'string', 'max:170', Rule::unique('brands', 'slug')->ignore($brand)], 'logo' => ['nullable', 'string', 'max:255'], 'logo_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:2048'], 'description' => ['nullable', 'string'], 'sort_order' => ['nullable', 'integer', 'min:0'], 'status' => ['required', 'boolean']];
    }
}
