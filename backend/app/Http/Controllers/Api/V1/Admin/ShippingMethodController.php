<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\ShippingMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ShippingMethodController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('shipping'), 403);

        return $this->success(ShippingMethod::query()->orderBy('sort_order')->orderBy('id')->paginate((int) $request->integer('per_page', 20)));
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('shipping'), 403);

        $method = ShippingMethod::create($this->validated($request));

        return $this->success($method, 'Đã tạo phương thức vận chuyển.', status: 201);
    }

    public function show(Request $request, ShippingMethod $shippingMethod): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('shipping'), 403);

        return $this->success($shippingMethod);
    }

    public function update(Request $request, ShippingMethod $shippingMethod): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('shipping'), 403);

        $shippingMethod->update($this->validated($request, $shippingMethod));

        return $this->success($shippingMethod->refresh(), 'Đã cập nhật phương thức vận chuyển.');
    }

    public function destroy(Request $request, ShippingMethod $shippingMethod): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('shipping'), 403);

        if ($shippingMethod->orders()->exists()) {
            $shippingMethod->update(['active' => false]);

            return $this->success($shippingMethod->refresh(), 'Phương thức đã có đơn hàng nên được chuyển về ngừng sử dụng.');
        }

        $shippingMethod->delete();

        return $this->success(null, 'Đã xóa phương thức vận chuyển.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?ShippingMethod $shippingMethod = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:80', Rule::unique('shipping_methods', 'code')->ignore($shippingMethod?->id)],
            'description' => ['nullable', 'string', 'max:1000'],
            'fee' => ['required', 'numeric', 'min:0'],
            'free_shipping_threshold' => ['nullable', 'numeric', 'min:0'],
            'estimated_days_min' => ['nullable', 'integer', 'min:0'],
            'estimated_days_max' => ['nullable', 'integer', 'gte:estimated_days_min'],
            'active' => ['required', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
    }
}
