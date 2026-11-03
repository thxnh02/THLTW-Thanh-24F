const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/register' });
Object.assign(global, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true });
Object.defineProperty(global, 'navigator', { configurable: true, value: dom.window.navigator });
const React = require('react');
global.React = React;
const redirects = [];
let registration;
let added;
let existingGuest = [];
let authUser = { id: 1 };
let checkoutPayload;
let pdfDownloads = [];
let pdfFailure = null;
let returnVerified = true;
let orderResult = { id: 1, status: 'pending', payment_method: 'cod', payment_status: 'demo_paid', grand_total_vnd: 100000, items: [{ id: 1, product_name: 'Tai nghe', quantity: 1, line_total_vnd: 100000 }] };
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === 'next/navigation') return { useRouter: () => ({ replace: (target) => redirects.push(target), push: (target) => redirects.push(target) }), useParams: () => ({ id: '1' }) };
  if (request === 'next/link') return function LinkMock({ href, children, ...props }) { return React.createElement('a', { href, ...props }, children); };
  if (request === '@/contexts/CustomerAuthContext') return { useCustomerAuth: () => ({ user: authUser, loading: false, refreshUser: async () => ({ id: 1 }) }) };
  if (request === '@/contexts/CartContext') return { useCart: () => ({ guest: existingGuest, server: { items: [{ product_id: 17, quantity: 5 }] }, refresh: async () => {}, add: async (...args) => { added = args; } }) };
  if (request === '@/services/customerAuthServices') return { __esModule: true, default: { register: async (data) => { registration = data; return { data: { data: { user: { id: 1 } } } }; } } };
  if (request === '@/services/commerceServices') return { __esModule: true, default: { order: async () => ({ data: { data: orderResult } }), orderPdf: async (id) => { pdfDownloads.push(id); if (pdfFailure) throw pdfFailure; return { data: new Blob(['%PDF-test'], { type: 'application/pdf' }) }; }, returnStatus: async () => ({ data: { data: { verified_return: returnVerified, order_id: returnVerified ? 1 : null } } }), checkout: async (payload) => { checkoutPayload = payload; return { data: { data: { order: { id: 1 } } } }; } } };
  if (request === '@/services/customerAccountServices') return { __esModule: true, default: { addresses: async () => ({ data: { data: { addresses: [{ id: 1, recipient_name: 'An', recipient_phone: '0912345678', full_address: 'Địa chỉ thử' }] } } }) } };
  if (request === '@/lib/axiosClient') return { __esModule: true, default: { get: async (url) => ({ data: { data: url.startsWith('/products/id/') ? { id: 17, name: 'Tai nghe', slug: 'tai-nghe', price: '100000.00', sale_price: null, stock_quantity: 10 } : { cod_demo_enabled: true, vnpay_sandbox_enabled: false, shipping_fee_vnd: 0 } } }) } };
  return originalLoad.call(this, request, ...args);
};
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(this, request.startsWith('@/') ? path.join(__dirname, '../src', request.slice(2)) : request, ...args);
};
require('tsx/cjs');
const { act } = React;
const { createRoot } = require('react-dom/client');
const RegisterPage = require('../src/app/(shop)/register/page.jsx').default;
const ProductCard = require('../src/components/shop/ProductCard.jsx').default;
const CustomerOrderDetailPage = require('../src/app/(shop)/account/orders/[id]/page.jsx').default;
const PaymentResultPage = require('../src/app/(shop)/payment-result/page.jsx').default;
const CheckoutPage = require('../src/app/(shop)/checkout/page.jsx').default;

test('customer order detail downloads its PDF through the authenticated order service', async () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  URL.createObjectURL = () => 'blob:order-pdf';
  URL.revokeObjectURL = () => {};
  pdfDownloads = [];
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await act(async () => { root.render(React.createElement(CustomerOrderDetailPage)); });
  await act(async () => { [...host.querySelectorAll('button')].find((button) => button.textContent.includes('PDF')).click(); });
  assert.deepEqual(pdfDownloads, ['1']);
  assert.match(host.textContent, /Tải phiếu đơn hàng PDF/);
  await act(async () => { root.unmount(); }); host.remove();
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});

test('customer order PDF explains an expired authenticated session', async () => {
  pdfFailure = { response: { status: 401 } };
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await act(async () => { root.render(React.createElement(CustomerOrderDetailPage)); });
  await act(async () => { [...host.querySelectorAll('button')].find((button) => button.textContent.includes('PDF')).click(); });
  assert.match(host.querySelector('[role="alert"]')?.textContent ?? '', /Phiên đăng nhập đã hết hạn/);
  await act(async () => { root.unmount(); }); host.remove();
  pdfFailure = null;
});

const type = async (id, value) => {
  const input = document.getElementById(id);
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => { setter.call(input, value); input.dispatchEvent(new window.Event('input', { bubbles: true })); });
};

test('registration creates an immediate session path with optional email verification', async () => {
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await act(async () => { root.render(React.createElement(RegisterPage)); });
  await type('register-name', 'Nguyễn An');
  await type('register-email', ' Buyer@Example.Test ');
  await type('register-password', 'example-password');
  await type('register-password-confirmation', 'example-password');
  await act(async () => { host.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); });
  assert.equal(registration.email, 'buyer@example.test');
  assert.equal(redirects.at(-1), '/account/security?registered=1');
  assert.match(host.textContent, /xác minh email sau/i);
  await act(async () => { root.unmount(); }); host.remove();
});

test('product card adds the selected product to the cart with a real button', async () => {
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await act(async () => { root.render(React.createElement(ProductCard, { product: { id: 17, name: 'Tai nghe', slug: 'tai-nghe', price: '100000.00', category: { name: 'Âm thanh' } } })); });
  await act(async () => { host.querySelector('button[aria-label*="Thêm"]').click(); });
  assert.deepEqual(added, [17, 1]);
  assert.match(host.textContent, /Đã thêm vào giỏ/);
  await act(async () => { root.unmount(); }); host.remove();
});

test('buy now ignores an existing cart item and carries quantity one', async () => {
  existingGuest = [{ product_id: 17, quantity: 2 }]; added = null;
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await act(async () => { root.render(React.createElement(ProductCard, { product: { id: 17, name: 'Tai nghe', slug: 'tai-nghe', price: '100000.00' } })); });
  await act(async () => { [...host.querySelectorAll('button')].find((button) => button.textContent === 'Mua ngay').click(); });
  assert.equal(added, null);
  assert.equal(redirects.at(-1), '/checkout?buy=17&quantity=1');
  await act(async () => { root.unmount(); }); host.remove();
  existingGuest = [];
});

test('buy now checkout keeps its own quantity through reload and submits without changing cart', async () => {
  window.history.replaceState({}, '', '/checkout?buy=17&quantity=2');
  checkoutPayload = null; added = null;
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await act(async () => { root.render(React.createElement(CheckoutPage)); });
  assert.match(host.textContent, /giỏ hàng của bạn sẽ được giữ nguyên/);
  assert.equal(document.getElementById('buy-now-quantity').value, '2');
  await act(async () => { [...host.querySelectorAll('button')].find((button) => button.textContent === 'Xác nhận đặt hàng').click(); });
  assert.equal(checkoutPayload.buy_now_product_id, 17);
  assert.equal(checkoutPayload.buy_now_quantity, 2);
  assert.equal(added, null);
  assert.equal(redirects.at(-1), '/payment-result?order=1');
  await act(async () => { root.unmount(); }); host.remove();
  window.history.replaceState({}, '', '/register');
});

test('guest buy now login redirect preserves product and quantity', async () => {
  authUser = null;
  window.history.replaceState({}, '', '/checkout?buy=17&quantity=3');
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await act(async () => { root.render(React.createElement(CheckoutPage)); });
  assert.equal(redirects.at(-1), '/login?returnTo=%2Fcheckout%3Fbuy%3D17%26quantity%3D3');
  await act(async () => { root.unmount(); }); host.remove();
  authUser = { id: 1 };
  window.history.replaceState({}, '', '/register');
});

test('order result clearly labels simulated COD success', async () => {
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await act(async () => { root.render(React.createElement(CustomerOrderDetailPage)); });
  assert.match(host.textContent, /Đặt hàng thành công · thanh toán khi giao hàng/);
  assert.match(host.textContent, /Bạn sẽ thanh toán khi nhận hàng \(COD\)/);
  assert.doesNotMatch(host.textContent, /demo|mô phỏng/i);
  await act(async () => { root.unmount(); }); host.remove();
});

test('browser gateway return stays pending until the order is server-confirmed', async () => {
  orderResult = { id: 1, status: 'pending', payment_method: 'vnpay', payment_status: 'pending' };
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await act(async () => { root.render(React.createElement(PaymentResultPage)); });
  assert.match(host.textContent, /VNPay/);
  assert.doesNotMatch(host.textContent, /Thanh toán thành công/);
  await act(async () => { root.unmount(); }); host.remove();
});

test('failed payment result stops polling and points to the order for safe retry', async () => {
  orderResult = { id: 1, status: 'pending', payment_method: 'vnpay', payment_status: 'failed' };
  const originalTimer = window.setTimeout;
  let timers = 0;
  window.setTimeout = (...args) => { timers++; return originalTimer(...args); };
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await act(async () => { root.render(React.createElement(PaymentResultPage)); });
  assert.match(host.textContent, /giao dịch không thành công/);
  assert.equal(timers, 0);
  assert.equal(host.querySelector('a').getAttribute('href'), '/account/orders/1');
  await act(async () => { root.unmount(); }); host.remove();
  window.setTimeout = originalTimer;
});

test('invalid payment return does not show an order identifier', async () => {
  returnVerified = false;
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await act(async () => { root.render(React.createElement(PaymentResultPage)); });
  assert.match(host.textContent, /không hợp lệ/);
  assert.equal(host.querySelector('a').getAttribute('href'), '/account/orders');
  await act(async () => { root.unmount(); }); host.remove();
  returnVerified = true;
});
