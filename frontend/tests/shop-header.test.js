const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (relativePath) => fs.readFileSync(path.join(__dirname, relativePath), "utf8");

test("shop header scrolls with the document and search suggestions close on scroll", () => {
  const header = read("../src/components/shop/ShopHeader.jsx");
  const search = read("../src/components/shop/GlobalProductSearch.jsx");
  assert.doesNotMatch(header, /\bsticky\b|\btop-0\b|translate-y-full/);
  assert.match(search, /document\.addEventListener\("scroll", closeOnScroll, true\)/);
});
