<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Order;

trait RendersOrderInvoice
{
    protected function renderInvoiceHtml(Order $order): string
    {
        $order->loadMissing(['items', 'payment']);
        $rows = $order->items->map(function ($item): string {
            return sprintf(
                '<tr><td>%s<br><small>%s - %s</small></td><td class="right">%d</td><td class="right">%s</td><td class="right">%s</td></tr>',
                e($item->product_name),
                e($item->variant_name),
                e($item->sku),
                $item->quantity,
                $this->money($item->unit_price),
                $this->money($item->subtotal),
            );
        })->implode('');

        return '<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Hoa don '.$order->code.'</title><style>
body{font-family:Arial,sans-serif;color:#0f172a;margin:32px}.header{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #0f172a;padding-bottom:16px}
h1{margin:0;font-size:28px}.muted{color:#64748b}.box{margin-top:20px;padding:16px;border:1px solid #e2e8f0;border-radius:8px}
table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left}th{background:#f8fafc}
.right{text-align:right}.total{font-size:20px;font-weight:700}.print{margin-top:24px}@media print{.print{display:none}body{margin:0}}</style></head><body>
<div class="header"><div><h1>Hoa don ban hang</h1><p class="muted">'.e(config('app.name')).'</p></div><div class="right"><strong>'.e($order->code).'</strong><br><span class="muted">'.e($order->created_at?->format('d/m/Y H:i')).'</span></div></div>
<div class="box"><strong>Khach hang</strong><br>'.e($order->customer_name).'<br>'.e($order->customer_email).' - '.e($order->customer_phone).'<br>'.e($order->shipping_address).'</div>
<table><thead><tr><th>San pham</th><th class="right">SL</th><th class="right">Don gia</th><th class="right">Thanh tien</th></tr></thead><tbody>'.$rows.'</tbody></table>
<table><tr><td>Tam tinh</td><td class="right">'.$this->money($order->subtotal).'</td></tr><tr><td>Giam gia</td><td class="right">'.$this->money($order->discount_total).'</td></tr><tr><td>Phi van chuyen</td><td class="right">'.$this->money($order->shipping_fee).'</td></tr><tr><td class="total">Tong cong</td><td class="right total">'.$this->money($order->grand_total).'</td></tr></table>
<p>Thanh toan: '.e(strtoupper($order->payment_method)).' - '.e($order->payment_status).'</p><button class="print" onclick="window.print()">In / Luu PDF</button></body></html>';
    }

    protected function money(string|float|int|null $value): string
    {
        return number_format((float) $value).'d';
    }
}
