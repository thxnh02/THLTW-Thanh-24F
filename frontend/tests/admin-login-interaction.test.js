const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/admin/login' });
Object.assign(global, {
  window: dom.window, document: dom.window.document,
  HTMLElement: dom.window.HTMLElement, Element: dom.window.Element,
  Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(global, 'navigator', { configurable: true, value: dom.window.navigator });

const React = require('react');
global.React = React;
const redirects = [];
let login = async () => {};
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === 'next/navigation') return { useRouter: () => ({ replace: (target) => redirects.push(target) }) };
  if (request === 'next/link') return function LinkMock({ href, children, ...props }) { return React.createElement('a', { href, ...props }, children); };
  if (request === '@/services/adminAuthServices') return { __esModule: true, default: { login: (...args) => login(...args) } };
  return originalLoad.call(this, request, ...args);
};
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(this, request.startsWith('@/') ? path.join(__dirname, '../src', request.slice(2)) : request, ...args);
};
require('tsx/cjs');
const { act } = React;
const { createRoot } = require('react-dom/client');
const AdminLoginPage = require('../src/app/admin/login/page.jsx').default;

const type = async (id, value) => {
  const input = document.getElementById(id);
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => { setter.call(input, value); input.dispatchEvent(new window.Event('input', { bubbles: true })); });
};

test('admin login submits credentials and returns only to a safe admin page', async () => {
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  window.history.replaceState({}, '', '/admin/login?returnTo=%2Fadmin%2Fproduct');
  let credentials;
  login = async (value) => { credentials = value; };
  await act(async () => { root.render(React.createElement(AdminLoginPage)); });
  await type('admin-email', ' Admin@Example.Test ');
  await type('admin-password', 'example-password');
  await act(async () => { document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); });
  assert.deepEqual(credentials, { email: 'admin@example.test', password: 'example-password' });
  assert.equal(redirects.at(-1), '/admin/product');
  await act(async () => { root.unmount(); });
  host.remove();
});

test('failed admin login shows an error and does not navigate', async () => {
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  redirects.length = 0;
  login = async () => { throw { response: { status: 422, data: { message: 'Thông tin đăng nhập quản trị không hợp lệ.' } } }; };
  await act(async () => { root.render(React.createElement(AdminLoginPage)); });
  await type('admin-email', 'admin@example.test');
  await type('admin-password', 'wrong-password');
  await act(async () => { document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); });
  assert.match(document.querySelector('[role="alert"]').textContent, /không hợp lệ/);
  assert.equal(redirects.length, 0);
  await act(async () => { root.unmount(); });
  host.remove();
});
