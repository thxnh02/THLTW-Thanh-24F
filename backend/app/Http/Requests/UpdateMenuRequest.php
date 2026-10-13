<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateMenuRequest extends FormRequest
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
            'parent_id' => ['nullable', 'integer', 'exists:menus,id'],
            'label' => ['required', 'string', 'max:160'],
            'url' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:custom,page,category,post'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'active' => ['required', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $menu = $this->route('menu');

            if ($menu && (int) ($this->input('parent_id') ?? 0) === $menu->id) {
                $validator->errors()->add('parent_id', 'Menu cha không hợp lệ.');
            }
        });
    }
}
