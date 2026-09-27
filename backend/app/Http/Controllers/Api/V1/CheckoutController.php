<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Mail\OrderConfirmationMail;
use App\Models\Order;
use App\Services\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

class CheckoutController extends Controller
{
    use ApiResponses;

    public function store(CheckoutRequest $request, CheckoutService $checkoutService, CartController $cartController): JsonResponse
    {
        try {
            $order = $checkoutService->createOrder(
                $request->validated(),
                $request->user()?->id,
                $request->ip() ?: '127.0.0.1',
                $cartController
            );
        } catch (HttpException $exception) {
            return $this->error($exception->getMessage(), $exception->getStatusCode());
        }

        if (! $checkoutService->reusedExistingOrder()) {
            $this->sendOrderConfirmation($order);
        }

        return $this->success(
            $order,
            $checkoutService->reusedExistingOrder() ? 'Don hang da ton tai.' : 'Dat hang thanh cong.',
            status: $checkoutService->reusedExistingOrder() ? 200 : 201,
        );
    }

    private function sendOrderConfirmation(Order $order): void
    {
        try {
            Mail::to($order->customer_email)->send(new OrderConfirmationMail($order->loadMissing(['items', 'payment'])));
        } catch (Throwable $exception) {
            Log::warning('Order confirmation email failed.', [
                'order_id' => $order->id,
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
