<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreShippingMethodRequest;
use App\Http\Requests\UpdateShippingMethodRequest;
use App\Http\Resources\ShippingMethodResource;
use App\Models\ShippingMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingMethodController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('shipping'), 403);

        return $this->success(ShippingMethod::query()->orderBy('sort_order')->orderBy('id')->paginate((int) $request->integer('per_page', 20)));
    }

    public function store(StoreShippingMethodRequest $request): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('shipping'), 403);

        $method = ShippingMethod::create($request->validated());

        return $this->success(new ShippingMethodResource($method), 'Đã tạo phương thức vận chuyển.', status: 201);
    }

    public function show(Request $request, ShippingMethod $shippingMethod): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('shipping'), 403);

        return $this->success(new ShippingMethodResource($shippingMethod));
    }

    public function update(UpdateShippingMethodRequest $request, ShippingMethod $shippingMethod): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('shipping'), 403);

        $shippingMethod->update($request->validated());

        return $this->success(new ShippingMethodResource($shippingMethod->refresh()), 'Đã cập nhật phương thức vận chuyển.');
    }

    public function destroy(Request $request, ShippingMethod $shippingMethod): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('shipping'), 403);

        if ($shippingMethod->orders()->exists()) {
            $shippingMethod->update(['active' => false]);

            return $this->success(new ShippingMethodResource($shippingMethod->refresh()), 'Phương thức đã có đơn hàng nên được chuyển về ngừng sử dụng.');
        }

        $shippingMethod->delete();

        return $this->success(null, 'Đã xóa phương thức vận chuyển.');
    }
}
