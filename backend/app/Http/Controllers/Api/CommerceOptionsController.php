<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\VnPayGateway;
use Illuminate\Http\JsonResponse;

class CommerceOptionsController extends Controller
{
    public function __invoke(VnPayGateway $gateway): JsonResponse
    {
        return response()->json(['data' => [
            'cod_enabled' => (bool) config('commerce.cod_enabled'),
            'vnpay_sandbox_enabled' => $gateway->configured(),
            'shipping_fee_vnd' => (int) config('commerce.shipping_fee_vnd', 0),
        ]]);
    }
}
