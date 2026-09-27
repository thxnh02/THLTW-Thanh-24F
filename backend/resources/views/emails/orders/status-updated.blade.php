<x-mail::message>
# Cap nhat don hang

Don hang **{{ $order->code }}** hien o trang thai **{{ $statusLabel }}**.

@if ($order->shipping_carrier || $order->tracking_code)
<x-mail::panel>
Don vi van chuyen: **{{ $order->shipping_carrier ?? 'Dang cap nhat' }}**
Ma van don: **{{ $order->tracking_code ?? 'Dang cap nhat' }}**
</x-mail::panel>
@endif

Tong thanh toan: **{{ number_format((float) $order->grand_total) }}d**

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
