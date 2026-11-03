<!doctype html>
<html lang="vi"><body>
<h1>{{ $title }}</h1>
<p>{{ $eventMessage }}</p>
<p>Mã đơn: {{ $order->order_code ?? 'Đơn hàng cũ' }}</p>
<p>Ngày tạo: {{ optional($order->created_at)->format('d/m/Y H:i') }}</p>
<table cellpadding="8" cellspacing="0" border="1" width="100%">
  <thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
  <tbody>@foreach($order->items as $item)<tr>
    <td>{{ $item->product_name }}</td><td>{{ $item->quantity }}</td>
    <td>{{ number_format($item->unit_price_vnd, 0, ',', '.') }} đ</td>
    <td>{{ number_format($item->line_total_vnd, 0, ',', '.') }} đ</td>
  </tr>@endforeach</tbody>
</table>
<p>Tạm tính: {{ $order->subtotal_vnd === null ? 'Chưa có dữ liệu' : number_format($order->subtotal_vnd, 0, ',', '.') . ' đ' }}</p>
<p>Phí giao hàng: {{ number_format($order->shipping_fee_vnd ?? 0, 0, ',', '.') }} đ</p>
<p><strong>Tổng cộng: {{ $order->grand_total_vnd === null ? 'Chưa có dữ liệu' : number_format($order->grand_total_vnd, 0, ',', '.') . ' đ' }}</strong></p>
<p>Thanh toán: {{ \App\Support\OrderPresentation::methodLabel($order) }} · {{ \App\Support\OrderPresentation::paymentLabel($order) }}</p>
<p>Trạng thái đơn: {{ \App\Support\OrderPresentation::fulfillmentLabel($order) }}</p>
@if(is_array($order->shipping_snapshot))
<p>Người nhận: {{ $order->shipping_snapshot['recipient_name'] ?? '' }} · {{ $order->shipping_snapshot['recipient_phone'] ?? '' }}</p>
<p>Địa chỉ: {{ collect([$order->shipping_snapshot['detail'] ?? null, $order->shipping_snapshot['street'] ?? null, $order->shipping_snapshot['ward'] ?? null, $order->shipping_snapshot['district'] ?? null, $order->shipping_snapshot['province'] ?? null])->filter()->implode(', ') }}</p>
@endif
<p><a href="{{ config('commerce.frontend_url') }}/account/orders/{{ $order->id }}">Đăng nhập vào CT_24F để xem thông tin và theo dõi đơn hàng.</a></p>
</body></html>
