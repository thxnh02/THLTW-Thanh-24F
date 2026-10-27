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
  assert.match(search, /isScrollInsideSuggestionList\(event\.target, suggestionList\.current\)/);
  assert.match(search, /event\.key === "Escape"/);
  assert.match(search, /ArrowDown/);
  assert.match(search, /ArrowUp/);
  assert.match(search, /controller\.abort\(\)/);
  assert.match(header, /onPointerDown=\{\(event\) => event\.stopPropagation\(\)\}/);
});

test("search scrolling dismisses suggestions only when the page scrolls", async () => {
  const { pathToFileURL } = require("node:url");
  const helperPath = path.join(__dirname, "../src/lib/shopSearch.mjs");
  const { isScrollInsideSuggestionList } = await import(pathToFileURL(helperPath).href);
  const list = { contains: (target) => target === "option" || target === "list" };
  assert.equal(isScrollInsideSuggestionList("option", list), true);
  assert.equal(isScrollInsideSuggestionList("page", list), false);
});
