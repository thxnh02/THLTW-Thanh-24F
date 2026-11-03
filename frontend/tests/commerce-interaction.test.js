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
let orderResult = { id: 1, status: 'pending', payment_method: 'cod', payment_status: 'demo_paid', grand_total_vnd: 100000, items: [{ id: 1, product_name: 'Tai nghe', quantity: 1, line_total_vnd: 100000 }] };
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === 'next/navigation') return { useRouter: () => ({ replace: (target) => redirects.push(target), push: (target) => redirects.push(target) }), useParams: () => ({ id: '1' }) };
  if (request === 'next/link') return function LinkMock({ href, children, ...props }) { return React.createElement('a', { href, ...props }, children); };
  if (request === '@/contexts/CustomerAuthContext') return { useCustomerAuth: () => ({ refreshUser: async () => ({ id: 1 }) }) };
  if (request === '@/contexts/CartContext') return { useCart: () => ({ guest: existingGuest, server: null, add: async (...args) => { added = args; } }) };
  if (request === '@/services/customerAuthServices') return { __esModule: true, default: { register: async (data) => { registration = data; return { data: { data: { user: { id: 1 } } } }; } } };
  if (request === '@/services/commerceServices') return { __esModule: true, default: { order: async () => ({ data: { data: orderResult } }) } };
  if (request === '@/lib/axiosClient') return { __esModule: true, default: { get: async () => ({ data: { data: { verified_return: true, order_id: 1 } } }) } };
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

test('buy now reuses an existing cart item without increasing its quantity', async () => {
  existingGuest = [{ product_id: 17, quantity: 2 }]; added = null;
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await act(async () => { root.render(React.createElement(ProductCard, { product: { id: 17, name: 'Tai nghe', slug: 'tai-nghe', price: '100000.00' } })); });
  await act(async () => { [...host.querySelectorAll('button')].find((button) => button.textContent === 'Mua ngay').click(); });
  assert.equal(added, null);
  assert.equal(redirects.at(-1), '/checkout?buy=17');
  await act(async () => { root.unmount(); }); host.remove();
  existingGuest = [];
});

test('order result clearly labels simulated COD success', async () => {
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await act(async () => { root.render(React.createElement(CustomerOrderDetailPage)); });
  assert.match(host.textContent, /thành công \(mô phỏng\)/);
  assert.match(host.textContent, /chưa có tiền thực nhận/);
  await act(async () => { root.unmount(); }); host.remove();
});

test('browser gateway return stays pending until the order is server-confirmed', async () => {
  orderResult = { id: 1, status: 'pending', payment_method: 'vnpay', payment_status: 'pending' };
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await act(async () => { root.render(React.createElement(PaymentResultPage)); });
  assert.match(host.textContent, /Đang chờ xác nhận thanh toán/);
  assert.doesNotMatch(host.textContent, /Thanh toán thành công/);
  await act(async () => { root.unmount(); }); host.remove();
});
