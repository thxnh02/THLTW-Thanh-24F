<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StorePromotionRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:80', 'unique:promotions,code'],
            'type' => ['required', 'in:fixed,percent'],
            'applies_to' => ['nullable', 'in:all,products,categories,brands'],
            'value' => ['required', 'numeric', 'gt:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'first_order_only' => ['nullable', 'boolean'],
            'free_shipping' => ['nullable', 'boolean'],
            'min_quantity' => ['nullable', 'integer', 'min:1'],
            'start_at' => ['nullable', 'date'],
            'end_at' => ['nullable', 'date', 'after_or_equal:start_at'],
            'active' => ['required', 'boolean'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'usage_limit_per_user' => ['nullable', 'integer', 'min:1'],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['integer', 'exists:products,id'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'brand_ids' => ['nullable', 'array'],
            'brand_ids.*' => ['integer', 'exists:brands,id'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'code' => strtoupper(trim((string) $this->input('code', ''))),
            'applies_to' => $this->input('applies_to') ?: 'all',
            'min_order_amount' => $this->input('min_order_amount') ?? 0,
            'first_order_only' => (bool) $this->input('first_order_only', false),
            'free_shipping' => (bool) $this->input('free_shipping', false),
        ]);
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->input('type') === 'percent' && (float) $this->input('value', 0) > 100) {
                $validator->errors()->add('value', 'Giá trị phần trăm không được vượt quá 100.');
            }
        });
    }
}
