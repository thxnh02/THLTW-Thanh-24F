<!doctype html>
<html lang="vi"><head><meta charset="utf-8"></head><body>
<h1>CT_24F · Có đơn hàng mới</h1>
<p>Mã đơn: {{ $order->order_code ?? 'Đơn cũ' }}</p>
<p>Tổng tiền: {{ $order->grand_total_vnd === null ? 'Chưa có dữ liệu' : number_format($order->grand_total_vnd, 0, ',', '.') . ' đ' }}</p>
<p>Thanh toán: {{ $order->payment_method === 'vnpay' ? 'VNPay' : 'COD · thanh toán khi nhận hàng' }} · {{ $order->payment_status === 'demo_paid' ? 'Chờ thu khi giao hàng' : ($order->payment_status ?? 'Chưa có dữ liệu') }}</p>
<p><a href="{{ config('commerce.frontend_url') }}/admin/orders/{{ $order->id }}">Đăng nhập Admin để xem chi tiết</a>. Thư này không chứa địa chỉ hoặc số điện thoại khách hàng.</p>
</body></html>
