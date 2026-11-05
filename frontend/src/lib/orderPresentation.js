export function getPaymentLabel(order = {}) {
  if (order.status === 'cancelled' && order.payment_method === 'cod') return 'Đơn hàng đã hủy';
  if (order.payment_method === 'cod' && ['pending', 'demo_paid'].includes(order.payment_status)) return 'Thanh toán khi nhận hàng';
  if (order.payment_method === 'vnpay' && order.payment_status === 'paid') return 'Thanh toán thành công qua VNPay';

  return ({
    pending: order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Đang chờ xác nhận thanh toán',
    failed: 'Thanh toán không thành công',
    needs_review: 'Giao dịch cần kiểm tra',
  })[order.payment_status] ?? 'Đơn cũ chưa có dữ liệu thanh toán';
}

export function getFulfillmentLabel(order = {}) {
  if (order.status === 'cancelled') return 'Đơn hàng đã hủy';

  return ({
    pending: 'Đơn hàng đang chờ xử lý',
    processing: 'Đơn hàng đang được xử lý',
    shipping: 'Đơn hàng đang được giao',
    delivered: 'Đơn hàng đã giao',
  })[order.status] ?? 'Chưa có dữ liệu trạng thái đơn';
}

export function getPaymentResultCopy(order = {}) {
  if (order.status === 'cancelled') return { title: 'Đơn hàng đã hủy', description: 'Đơn hàng đã được hủy.' };
  if (order.payment_method === 'cod' && ['pending', 'demo_paid'].includes(order.payment_status)) {
    return { title: 'Đặt hàng thành công', description: 'Đơn hàng đã được ghi nhận. Bạn thanh toán khi nhận hàng.' };
  }
  if (order.payment_method === 'vnpay' && order.payment_status === 'paid') {
    return { title: 'Thanh toán thành công!', description: 'VNPay đã xác nhận giao dịch thanh toán.' };
  }
  if (order.payment_status === 'failed') return { title: 'Thanh toán không thành công', description: 'VNPay xác nhận giao dịch không thành công.' };
  if (order.payment_status === 'needs_review') return { title: 'Giao dịch cần kiểm tra', description: 'Vui lòng không thanh toán lại trước khi giao dịch được đối soát.' };
  if (order.payment_status === 'pending') return { title: 'Đang xác nhận thanh toán', description: 'Đang chờ VNPay xác nhận giao dịch.' };

  return { title: 'Kết quả thanh toán', description: 'Trạng thái đơn hàng cần được kiểm tra trong tài khoản.' };
}
