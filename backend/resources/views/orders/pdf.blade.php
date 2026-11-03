<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: "DejaVu Sans", sans-serif; color: #17382f; font-size: 11px; line-height: 1.55; }
    h1 { font-size: 20px; margin: 4px 0 18px; text-align: center; }
    h2 { font-size: 13px; border-bottom: 1px solid #cbd9ce; padding-bottom: 5px; margin: 18px 0 8px; }
    .brand { text-align: center; color: #416358; font-size: 12px; font-weight: bold; letter-spacing: 2px; }
    .muted { color: #5b6e64; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #d9e2db; padding: 7px; vertical-align: top; }
    th { background: #edf3ee; text-align: left; }
    .right { text-align: right; }
    .totals { width: 55%; margin-left: auto; }
    .notice { margin-top: 18px; padding: 9px; background: #f1f6f1; }
  </style>
</head>
<body>
  <p class="brand">CT_24F SHOP</p>
  <h1>PHIẾU XÁC NHẬN ĐƠN HÀNG</h1>
  <p><strong>Mã đơn:</strong> {{ $order->order_code ?? 'Đơn cũ #'.$order->id }}</p>
  <p><strong>Ngày tạo:</strong> {{ $order->created_at?->format('d/m/Y H:i') ?? 'Chưa có dữ liệu' }}</p>
  <p><strong>Khách hàng:</strong> {{ $order->user?->name ?? 'Không còn thông tin tài khoản' }}</p>

  <h2>Thông tin giao hàng</h2>
  @php($address = is_array($order->shipping_snapshot) ? $order->shipping_snapshot : [])
  @if($address)
    <p><strong>Người nhận:</strong> {{ $address['recipient_name'] ?? '' }} · {{ $address['recipient_phone'] ?? '' }}</p>
    <p><strong>Địa chỉ:</strong> {{ collect([$address['detail'] ?? null, $address['street'] ?? null, $address['ward'] ?? null, $address['district'] ?? null, $address['province'] ?? null])->filter()->implode(', ') }}</p>
    @if(!empty($address['delivery_note']))<p><strong>Ghi chú giao hàng:</strong> {{ $address['delivery_note'] }}</p>@endif
  @else
    <p class="muted">Đơn cũ chưa lưu ảnh chụp địa chỉ giao hàng.</p>
  @endif

  <h2>Sản phẩm</h2>
  <table>
    <thead><tr><th>Sản phẩm</th><th class="right">Số lượng</th><th class="right">Đơn giá</th><th class="right">Thành tiền</th></tr></thead>
    <tbody>
    @forelse($order->items as $item)
      <tr>
        <td>{{ $item->product_name }}</td>
        <td class="right">{{ $item->quantity }}</td>
        <td class="right">{{ number_format($item->unit_price_vnd, 0, ',', '.') }} đ</td>
        <td class="right">{{ number_format($item->line_total_vnd, 0, ',', '.') }} đ</td>
      </tr>
    @empty
      <tr><td colspan="4" class="muted">Đơn cũ chưa lưu chi tiết sản phẩm.</td></tr>
    @endforelse
    </tbody>
  </table>
  <table class="totals">
    <tr><th>Tạm tính</th><td class="right">{{ $order->subtotal_vnd === null ? 'Chưa có dữ liệu' : number_format($order->subtotal_vnd, 0, ',', '.') . ' đ' }}</td></tr>
    <tr><th>Phí giao hàng</th><td class="right">{{ number_format($order->shipping_fee_vnd ?? 0, 0, ',', '.') }} đ</td></tr>
    <tr><th>Tổng cộng</th><td class="right"><strong>{{ $order->grand_total_vnd === null ? 'Chưa có dữ liệu' : number_format($order->grand_total_vnd, 0, ',', '.') . ' đ' }}</strong></td></tr>
  </table>

  <h2>Trạng thái</h2>
  <p><strong>Phương thức:</strong> {{ \App\Support\OrderPresentation::methodLabel($order) }}</p>
  <p><strong>Thanh toán:</strong> {{ \App\Support\OrderPresentation::paymentLabel($order) }}</p>
  <p><strong>Đơn hàng:</strong> {{ \App\Support\OrderPresentation::fulfillmentLabel($order) }}</p>
  @if($order->payment_method === 'vnpay')
    <p><strong>Mã giao dịch VNPay:</strong> {{ $order->paymentAttempts->where('state', 'succeeded')->last()?->provider_transaction_id ?? 'Chưa xác nhận giao dịch' }}</p>
  @endif
  @if($order->payment_method === 'cod')
    <p class="notice"><strong>Thanh toán khi nhận hàng.</strong> Bạn thanh toán cho nhân viên giao hàng khi nhận đơn.</p>
  @endif
  <p class="muted">Đây là phiếu xác nhận đơn hàng, không phải hóa đơn VAT hoặc chứng từ thuế.</p>
</body>
</html>
