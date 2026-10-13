<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateReturnStatusRequest extends FormRequest
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
            'status' => ['nullable', 'in:requested,approved,rejected,received,completed,canceled'],
            'refund_status' => ['nullable', 'in:none,pending,refunded,failed'],
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
