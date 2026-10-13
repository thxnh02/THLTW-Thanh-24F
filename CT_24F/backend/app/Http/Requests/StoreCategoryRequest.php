<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['parent_id' => ['nullable', 'integer', 'exists:categories,id'], 'name' => ['required', 'string', 'max:150'], 'slug' => ['required', 'string', 'max:170', 'unique:categories,slug'], 'description' => ['nullable', 'string'], 'image' => ['nullable', 'string', 'max:255'], 'sort_order' => ['nullable', 'integer', 'min:0'], 'status' => ['required', 'boolean']];
    }
}
