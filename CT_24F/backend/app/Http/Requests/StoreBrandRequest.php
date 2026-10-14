<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ResolvesCatalogSlug;
use App\Models\Brand;
use App\Rules\UniqueCatalogName;
use Illuminate\Foundation\Http\FormRequest;

class StoreBrandRequest extends FormRequest
{
    use ResolvesCatalogSlug;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeCatalogName();
        $this->resolveCatalogSlug(Brand::class, 170);
    }

    public function rules(): array
    {
        return ['name' => ['required', 'string', 'max:150', new UniqueCatalogName(Brand::class)], 'slug' => ['required', 'string', 'max:170', 'unique:brands,slug'], 'logo' => ['nullable', 'string', 'max:255'], 'logo_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:2048'], 'description' => ['nullable', 'string'], 'sort_order' => ['nullable', 'integer', 'min:0'], 'status' => ['required', 'boolean']];
    }
}
