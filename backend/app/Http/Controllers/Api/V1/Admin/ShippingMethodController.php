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

        return $this->success($method, 'Da tao phuong thuc van chuyen.', status: 201);
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

        return $this->success($shippingMethod->refresh(), 'Da cap nhat phuong thuc van chuyen.');
    }

    public function destroy(Request $request, ShippingMethod $shippingMethod): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('shipping'), 403);

        if ($shippingMethod->orders()->exists()) {
            $shippingMethod->update(['active' => false]);

            return $this->success($shippingMethod->refresh(), 'Phuong thuc da co don hang nen duoc chuyen ve ngung su dung.');
        }

        $shippingMethod->delete();

        return $this->success(null, 'Da xoa phuong thuc van chuyen.');
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
