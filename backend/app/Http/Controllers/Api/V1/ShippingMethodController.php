<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Services\ShippingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingMethodController extends Controller
{
    use ApiResponses;

    public function index(Request $request, ShippingService $shippingService): JsonResponse
    {
        $subtotal = (float) $request->input('subtotal', 0);

        return $this->success($shippingService->activeMethods()->map(function ($method) use ($subtotal): array {
            return [
                'id' => $method->id,
                'name' => $method->name,
                'code' => $method->code,
                'description' => $method->description,
                'fee' => $method->feeForSubtotal($subtotal),
                'base_fee' => (float) $method->fee,
                'free_shipping_threshold' => $method->free_shipping_threshold,
                'estimated_days_min' => $method->estimated_days_min,
                'estimated_days_max' => $method->estimated_days_max,
            ];
        })->values());
    }
}
