const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/' });
Object.assign(global, {
  window: dom.window, document: dom.window.document,
  HTMLElement: dom.window.HTMLElement, Element: dom.window.Element,
  Event: dom.window.Event, CustomEvent: dom.window.CustomEvent,
  MouseEvent: dom.window.MouseEvent, KeyboardEvent: dom.window.KeyboardEvent,
  NodeFilter: dom.window.NodeFilter,
  MutationObserver: dom.window.MutationObserver, getComputedStyle: dom.window.getComputedStyle,
  requestAnimationFrame: (callback) => setTimeout(callback, 0), cancelAnimationFrame: clearTimeout,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(global, 'navigator', { configurable: true, value: dom.window.navigator });
window.HTMLElement.prototype.scrollIntoView = () => {};
window.HTMLElement.prototype.hasPointerCapture = () => false;
window.HTMLElement.prototype.setPointerCapture = () => {};
window.HTMLElement.prototype.releasePointerCapture = () => {};

const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.join(__dirname, '../src', request.slice(2)) : request, ...args);
};
require('tsx/cjs');
const React = require('react');
global.React = React;
const { act } = React;
const { createRoot } = require('react-dom/client');
const AddressFormDialog = require('../src/components/shop/AddressFormDialog.jsx').default;
const { emptyAddressDraft } = require('../src/lib/accountAddressForm.mjs');

test('cancel closes address dialog without submitting; province options depend on chosen province', async () => {
  const root = createRoot(document.getElementById('root'));
  let submissions = 0;
  let latestDraft;
  function Harness() {
    const [open, setOpen] = React.useState(true);
    const [draft, setDraft] = React.useState({ ...emptyAddressDraft, ward: '' });
    latestDraft = draft;
    return React.createElement(AddressFormDialog, {
      open, setOpen, editing: null, draft, setDraft, fieldErrors: {}, setFieldErrors: () => {},
      dialogError: '', saving: false, onSubmit: (event) => { event.preventDefault(); submissions++; },
    });
  }
  await act(async () => { root.render(React.createElement(Harness)); });
  assert.ok(document.querySelector('input#address-province'));
  assert.equal(document.querySelectorAll('#address-province-options option').length, 34);
  const province = document.querySelector('input#address-province');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => { setter.call(province, 'Hà Nội'); province.dispatchEvent(new window.Event('input', { bubbles: true })); });
  assert.equal(latestDraft.province, 'Hà Nội');
  assert.ok([...document.querySelectorAll('#address-ward-options option')].some((option) => option.value === 'Ba Đình'));
  await act(async () => { document.querySelector('button[type="button"]:not([aria-label])').click(); });
  assert.equal(submissions, 0);
  assert.equal(document.querySelector('[role="dialog"]'), null);
  await act(async () => { root.unmount(); });
});

test('in-flight save keeps the address dialog open and disables cancellation', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  let submissions = 0;
  let closed = false;
  await act(async () => {
    root.render(React.createElement(AddressFormDialog, {
      open: true, setOpen: (value) => { if (!value) closed = true; }, editing: null,
      draft: emptyAddressDraft, setDraft: () => {}, fieldErrors: {}, setFieldErrors: () => {},
      dialogError: '', saving: true, onSubmit: (event) => { event.preventDefault(); submissions++; },
    }));
  });
  const cancel = [...document.querySelectorAll('button')].find((button) => button.textContent === 'Hủy');
  assert.equal(cancel.disabled, true);
  await act(async () => { cancel.click(); });
  assert.equal(submissions, 0);
  assert.equal(closed, false);
  assert.ok(document.querySelector('[role="dialog"]'));
  await act(async () => { root.unmount(); });
  host.remove();
});
