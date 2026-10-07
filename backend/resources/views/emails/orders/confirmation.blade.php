<x-mail::message>
# Cam on ban da dat hang

Don hang **{{ $order->code }}** da duoc ghi nhan.

<x-mail::panel>
Khach hang: **{{ $order->customer_name }}**  
Email: **{{ $order->customer_email }}**  
Dien thoai: **{{ $order->customer_phone }}**  
Dia chi giao hang: **{{ $order->shipping_address }}**
</x-mail::panel>

<x-mail::table>
| San pham | SL | Don gia | Thanh tien |
| --- | ---: | ---: | ---: |
@foreach ($order->items as $item)
| {{ $item->product_name }} ({{ $item->variant_name }}) | {{ $item->quantity }} | {{ number_format((float) $item->unit_price) }}d | {{ number_format((float) $item->subtotal) }}d |
@endforeach
</x-mail::table>

Tam tinh: **{{ number_format((float) $order->subtotal) }}d**  
Giam gia: **{{ number_format((float) $order->discount_total) }}d**  
Phi van chuyen: **{{ number_format((float) $order->shipping_fee) }}d**  
Tong thanh toan: **{{ number_format((float) $order->grand_total) }}d**

Phuong thuc thanh toan: **{{ strtoupper($order->payment_method) }}**

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
