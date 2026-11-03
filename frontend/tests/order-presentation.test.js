const test = require('node:test');
const assert = require('node:assert/strict');
const { getPaymentLabel, getFulfillmentLabel, getPaymentResultCopy } = require('../src/lib/orderPresentation.js');

test('COD checkout confirms the order while payment remains due on delivery', () => {
  const order = { payment_method: 'cod', payment_status: 'pending', status: 'pending' };

  assert.equal(getPaymentLabel(order), 'Thanh toán khi nhận hàng');
  assert.equal(getFulfillmentLabel(order), 'Đơn hàng đang chờ xử lý');
  assert.deepEqual(getPaymentResultCopy(order), {
    title: 'Đặt hàng thành công',
    description: 'Đơn hàng đã được ghi nhận. Bạn thanh toán khi nhận hàng.',
  });
});

test('cancelled COD status takes precedence over its legacy Demo payment state', () => {
  const order = { payment_method: 'cod', payment_status: 'demo_paid', status: 'cancelled' };

  assert.equal(getPaymentLabel(order), 'Đơn hàng đã hủy');
  assert.deepEqual(getPaymentResultCopy(order), {
    title: 'Đơn hàng đã hủy',
    description: 'Đơn hàng đã được hủy.',
  });
});

test('confirmed VNPay payment stays distinct from COD Demo', () => {
  const order = { payment_method: 'vnpay', payment_status: 'paid', status: 'pending' };

  assert.equal(getPaymentLabel(order), 'Thanh toán thành công qua VNPay');
  assert.deepEqual(getPaymentResultCopy(order), {
    title: 'Thanh toán thành công!',
    description: 'VNPay đã xác nhận giao dịch thanh toán.',
  });
});
