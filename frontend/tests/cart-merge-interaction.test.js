const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/cart' });
Object.assign(global, { window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true });
Object.defineProperty(global, 'navigator', { configurable: true, value: dom.window.navigator });
const React = require('react');
global.React = React;
let activeUser = null;
const merges = [];
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === '@/contexts/CustomerAuthContext') return { useCustomerAuth: () => ({ user: activeUser, loading: false }) };
  if (request === '@/services/commerceServices') return { __esModule: true, default: {
    merge: async (items) => { merges.push(items); return { data: { data: { accepted_product_ids: [7], rejected_product_ids: [] } } }; },
    cart: async () => ({ data: { data: { items: [{ product_id: 7, quantity: 1 }], subtotal_vnd: 1000 } } }),
  } };
  return originalLoad.call(this, request, ...args);
};
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(this, request.startsWith('@/') ? path.join(__dirname, '../src', request.slice(2)) : request, ...args);
};
require('tsx/cjs');
const { act } = React;
const { createRoot } = require('react-dom/client');
const { CartProvider, useCart } = require('../src/contexts/CartContext.jsx');

function Harness() {
  const cart = useCart();
  return React.createElement('div', null,
    React.createElement('span', { id: 'count' }, cart.count),
    React.createElement('button', { onClick: () => cart.add(7, 1) }, 'Thêm'));
}

test('guest cart stores only product IDs and merges once after login', async () => {
  const root = createRoot(document.getElementById('root'));
  await act(async () => { root.render(React.createElement(CartProvider, null, React.createElement(Harness))); });
  await act(async () => { document.querySelector('button').click(); });
  assert.deepEqual(JSON.parse(localStorage.getItem('ct24f_guest_cart_v1')), [{ product_id: 7, quantity: 1 }]);
  assert.equal(document.getElementById('count').textContent, '1');
  activeUser = { id: 10 };
  await act(async () => { root.render(React.createElement(CartProvider, null, React.createElement(Harness))); });
  assert.deepEqual(merges, [[{ product_id: 7, quantity: 1 }]]);
  assert.deepEqual(JSON.parse(localStorage.getItem('ct24f_guest_cart_v1')), []);
  assert.equal(document.getElementById('count').textContent, '1');
  await act(async () => { root.unmount(); });
});
