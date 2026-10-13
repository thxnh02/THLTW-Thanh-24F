<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $category = $this->route('category');

        return ['parent_id' => ['nullable', 'integer', 'exists:categories,id', Rule::notIn([$category?->id])], 'name' => ['required', 'string', 'max:150'], 'slug' => ['required', 'string', 'max:170', Rule::unique('categories', 'slug')->ignore($category)], 'description' => ['nullable', 'string'], 'image' => ['nullable', 'string', 'max:255'], 'sort_order' => ['nullable', 'integer', 'min:0'], 'status' => ['required', 'boolean']];
    }
}
