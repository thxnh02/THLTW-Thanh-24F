const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = (relativePath) => fs.readFileSync(path.join(__dirname, relativePath), "utf8");

test("product cards navigate to slug detail pages", () => {
  const card = source("../src/components/shop/ProductCard.jsx");
  assert.match(card, /href=\{`\/products\/\$\{encodeURIComponent\(product\.slug\)\}`\}/);
});

test("home categories link to the real category filter and feature only API-backed sections", () => {
  const home = source("../src/app/(shop)/page.jsx");
  assert.match(home, /\/products\?category_id=\$\{encodeURIComponent\(category\.id\)\}/);
  assert.match(home, /sort=newest/);
  assert.match(home, /sale=1/);
  assert.match(home, /featured=1/);
  assert.doesNotMatch(home, /bán chạy|best sellers|lượt mua/i);
});

test("product detail renders real relations, valid sale price, and related products", () => {
  const detail = source("../src/app/(shop)/products/[slug]/page.jsx");
  assert.match(detail, /getPublicProduct\(slug/);
  assert.match(detail, /getRelatedProducts\(slug/);
  assert.match(detail, /product\.category\?\.name/);
  assert.match(detail, /product\.brand\?\.name/);
  assert.match(detail, /Number\(product\.sale_price\) < Number\(product\.price\)/);
});
