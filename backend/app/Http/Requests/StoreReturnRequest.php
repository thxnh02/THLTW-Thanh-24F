<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreReturnRequest extends FormRequest
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
            'order_code' => ['required', 'string', 'max:80'],
            'reason' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.order_item_id' => ['required', 'integer', 'exists:order_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.reason' => ['nullable', 'string', 'max:120'],
            'items.*.condition_note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
