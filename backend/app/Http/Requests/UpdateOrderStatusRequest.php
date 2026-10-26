<?php

namespace App\Http\Requests;

use App\Models\Order;
use App\Support\OrderStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['status' => ['required', 'string', Rule::in(OrderStatus::values())]];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $order = $this->route('order');
            if ($validator->errors()->has('status') || ! $order instanceof Order) {
                return;
            }

            if (! in_array($this->input('status'), $order->allowedNextStatuses(), true)) {
                $validator->errors()->add('status', 'Không thể chuyển đơn hàng sang trạng thái này.');
            }
        }];
    }
}
