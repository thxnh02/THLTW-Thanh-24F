<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OrderExportController extends Controller
{
    public function customerPdf(Request $request, int $order): Response
    {
        $owned = Order::query()->where('user_id', $request->user()->id)
            ->with(['user', 'items', 'paymentAttempts'])->whereKey($order)->firstOrFail();

        return $this->render($owned);
    }

    public function adminPdf(Order $order): Response
    {
        return $this->render($order->load(['user', 'items', 'paymentAttempts']));
    }

    private function render(Order $order): Response
    {
        $filename = 'phieu-don-hang-'.preg_replace('/[^A-Za-z0-9-]/', '-', (string) ($order->order_code ?? $order->id)).'.pdf';
        $pdf = Pdf::loadView('orders.pdf', ['order' => $order])
            ->setPaper('a4')
            ->setOptions(['defaultFont' => 'DejaVu Sans', 'isRemoteEnabled' => false, 'isPhpEnabled' => false]);

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
