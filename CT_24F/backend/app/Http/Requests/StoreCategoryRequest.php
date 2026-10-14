<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ResolvesCatalogSlug;
use App\Models\Category;
use App\Rules\UniqueCatalogName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCategoryRequest extends FormRequest
{
    use ResolvesCatalogSlug;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeCatalogName();
        $this->resolveCatalogSlug(Category::class, 170);
    }

    public function rules(): array
    {
        return ['parent_id' => ['nullable', 'integer', Rule::exists('categories', 'id')->whereNull('deleted_at')], 'name' => ['required', 'string', 'max:150', new UniqueCatalogName(Category::class)], 'slug' => ['required', 'string', 'max:170', 'unique:categories,slug'], 'description' => ['nullable', 'string'], 'image' => ['nullable', 'string', 'max:255'], 'image_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:2048'], 'sort_order' => ['nullable', 'integer', 'min:0'], 'status' => ['required', 'boolean']];
    }
}
