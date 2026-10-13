<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class StoreCategoryRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:160'],
            'slug' => ['nullable', 'string', 'max:180', 'unique:categories,slug'],
            'image' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:active,inactive'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['slug' => $this->filled('slug') ? $this->input('slug') : Str::slug((string) $this->input('name'))]);
    }
}
