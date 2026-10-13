<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBrandRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['name' => ['required', 'string', 'max:150'], 'slug' => ['required', 'string', 'max:170', 'unique:brands,slug'], 'logo' => ['nullable', 'string', 'max:255'], 'description' => ['nullable', 'string'], 'sort_order' => ['nullable', 'integer', 'min:0'], 'status' => ['required', 'boolean']];
    }
}
