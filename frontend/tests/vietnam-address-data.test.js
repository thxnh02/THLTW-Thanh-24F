const test = require('node:test');
const assert = require('node:assert/strict');
const provinces = require('../src/data/vietnam-administrative-2025.json');

test('offline address dataset contains unique two-level 2025 administrative codes', () => {
  assert.equal(provinces.length, 34);
  assert.equal(new Set(provinces.map((province) => province.code)).size, 34);
  const wards = provinces.flatMap((province) => province.wards);
  assert.equal(wards.length, 3321);
  assert.equal(new Set(wards.map((ward) => ward.code)).size, 3321);
  assert.ok(provinces.every((province) => province.name && province.wards.length));
  assert.ok(wards.every((ward) => ward.name));
});
