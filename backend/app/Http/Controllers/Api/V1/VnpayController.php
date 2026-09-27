<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\PaymentResource;
use App\Services\VnpayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VnpayController extends Controller
{
    use ApiResponses;

    public function return(Request $request, VnpayService $vnpayService): JsonResponse
    {
        return $this->handleCallback($request, $vnpayService);
    }

    public function ipn(Request $request, VnpayService $vnpayService): JsonResponse
    {
        return $this->handleCallback($request, $vnpayService);
    }

    private function handleCallback(Request $request, VnpayService $vnpayService): JsonResponse
    {
        $result = $vnpayService->processCallback($request->query());

        if (isset($result['error'])) {
            return $this->error((string) $result['error'], (int) $result['status']);
        }

        return $this->success([
            'order' => new OrderResource($result['order']),
            'payment' => new PaymentResource($result['payment']),
        ], $result['paid'] ? 'Thanh toan VNPay thanh cong.' : 'Thanh toan VNPay khong thanh cong.');
    }
}
