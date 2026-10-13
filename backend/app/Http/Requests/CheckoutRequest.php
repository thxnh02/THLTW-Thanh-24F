<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
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
            'customer.name' => ['required', 'string', 'max:120'],
            'customer.email' => ['required', 'email', 'max:160'],
            'customer.phone' => ['required', 'string', 'max:30'],
            'customer.address' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:1000'],
            'payment_method' => ['required', 'in:cod,vnpay'],
            'promotion_code' => ['nullable', 'string', 'max:80'],
            'shipping_method_id' => ['nullable', 'integer', 'exists:shipping_methods,id'],
            'idempotency_key' => ['required', 'string', 'max:120'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }
}
