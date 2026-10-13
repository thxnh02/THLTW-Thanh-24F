<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBrandRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $brand = $this->route('brand');

        return ['name' => ['required', 'string', 'max:150'], 'slug' => ['required', 'string', 'max:170', Rule::unique('brands', 'slug')->ignore($brand)], 'logo' => ['nullable', 'string', 'max:255'], 'description' => ['nullable', 'string'], 'sort_order' => ['nullable', 'integer', 'min:0'], 'status' => ['required', 'boolean']];
    }
}
