const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");

const path = require("node:path");
const read = (relativePath) => readFileSync(path.join(__dirname, relativePath), "utf8");
const dashboard = read("../src/app/admin/page.jsx");
const products = read("../src/app/admin/product/page.jsx");
const createProduct = read("../src/app/admin/product/create/page.jsx");
const sidebar = read("../src/components/admin/SideBar.jsx");
const productForm = read("../src/components/admin/ProductForm.jsx");

test("admin dashboard sends product management to the product list", () => {
  assert.match(dashboard, /href="\/admin\/product"/);
  assert.doesNotMatch(dashboard, /href="\/admin\/product\/create"/);
  assert.doesNotMatch(dashboard, /sample|demo/i);
});

test("product section has a separate add-product page action", () => {
  assert.match(sidebar, /label: "Sản phẩm"/);
  assert.match(products, /href="\/admin\/product\/create"/);
  assert.match(products, />Thêm sản phẩm<\/Link>/);
  assert.match(createProduct, /<h1[^>]*>Thêm sản phẩm<\/h1>/);
});

test("product form uses concise Vietnamese labels without demo copy", () => {
  assert.match(productForm, /Thông tin cơ bản/);
  assert.match(productForm, /Thêm sản phẩm/);
  assert.doesNotMatch(productForm, /demo|sample|ví dụ:/i);
});
