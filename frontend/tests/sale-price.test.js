const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = (relativePath) => readFileSync(path.join(__dirname, relativePath), "utf8");

test("product create and edit form submits an optional sale price", () => {
  const form = source("../src/components/admin/ProductForm.jsx");
  assert.match(form, /name="sale_price"/);
  assert.match(form, /sale_price: form\.sale_price === "" \? null : Number\(form\.sale_price\)/);
  assert.match(form, /fieldError\("sale_price"\)/);
});

test("storefront and admin prices show the discount alongside the original price", () => {
  const card = source("../src/components/shop/ProductCard.jsx");
  const list = source("../src/app/admin/product/page.jsx");
  assert.match(card, /product\.sale_price != null/);
  assert.match(card, /formatPrice\(onSale \? product\.sale_price : product\.price\)/);
  assert.match(card, /line-through/);
  assert.match(list, /item\.sale_price \?\? item\.price/);
});
