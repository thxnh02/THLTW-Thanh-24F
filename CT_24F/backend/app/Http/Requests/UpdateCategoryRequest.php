<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ResolvesCatalogSlug;
use App\Models\Category;
use App\Rules\UniqueCatalogName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateCategoryRequest extends FormRequest
{
    use ResolvesCatalogSlug;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $category = $this->route('category');
        $this->normalizeCatalogName();
        $this->resolveCatalogSlug(Category::class, 170, $category instanceof Category ? $category->id : null);
    }

    public function rules(): array
    {
        $category = $this->route('category');

        return ['parent_id' => ['nullable', 'integer', Rule::exists('categories', 'id')->whereNull('deleted_at'), Rule::notIn([$category?->id])], 'name' => ['required', 'string', 'max:150', new UniqueCatalogName(Category::class, $category instanceof Category ? $category->id : null)], 'slug' => ['required', 'string', 'max:170', Rule::unique('categories', 'slug')->ignore($category)], 'description' => ['nullable', 'string'], 'image' => ['nullable', 'string', 'max:255'], 'image_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:2048'], 'sort_order' => ['nullable', 'integer', 'min:0'], 'status' => ['required', 'boolean']];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $category = $this->route('category');
            $parentId = $this->input('parent_id');

            if (! $category instanceof Category || ! $parentId || $validator->errors()->has('parent_id')) {
                return;
            }

            $visited = [];
            $parent = Category::query()->find($parentId);

            while ($parent !== null) {
                if ($parent->is($category)) {
                    $validator->errors()->add('parent_id', 'Không thể đặt danh mục làm con của một danh mục con thuộc chính nó.');

                    return;
                }

                if (isset($visited[$parent->id])) {
                    return;
                }

                $visited[$parent->id] = true;
                $parent = $parent->parent_id === null ? null : Category::query()->find($parent->parent_id);
            }
        }];
    }
}
