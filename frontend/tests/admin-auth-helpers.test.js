const test = require('node:test');
const assert = require('node:assert/strict');
const { safeAdminReturnTo } = require('../src/lib/adminAuthHelpers.mjs');

test('admin login returns only to local admin pages', () => {
  assert.equal(safeAdminReturnTo('/admin/product/create'), '/admin/product/create');
  assert.equal(safeAdminReturnTo('/admin'), '/admin');
  for (const target of ['//other.test', 'https://other.test', '/products', '/admin/login', '/admin/login?next=/admin', '/admin\\evil']) {
    assert.equal(safeAdminReturnTo(target), '/admin');
  }
});
