<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string', 'max:120'],
            'settings.*.value' => ['nullable', 'string', 'max:3000'],
            'settings.*.type' => ['required', 'in:string,number,boolean,json'],
        ];
    }
}
