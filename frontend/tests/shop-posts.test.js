const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const read = (file) => readFileSync(path.join(__dirname, file), "utf8");

test("shop navigation and home link to public posts", () => {
  assert.match(read("../src/components/shop/ShopHeader.jsx"), /\["\/posts", "Bài viết"\]/);
  assert.match(read("../src/app/(shop)/page.jsx"), /postServices\.getPublishedPosts/);
  assert.ok(existsSync(path.join(__dirname, "../src/app/(shop)/posts/page.jsx")));
  assert.ok(existsSync(path.join(__dirname, "../src/app/(shop)/posts/[slug]/page.jsx")));
});

test("shop post pages call public service endpoints", () => {
  const services = read("../src/services/postServices.js");
  assert.match(services, /getPublishedPosts:.*axiosClient\.get/);
  assert.match(services, /getPublishedPost:.*axiosClient\.get/);
  assert.match(read("../src/app/(shop)/posts/page.jsx"), /postServices\.getPublishedPosts/);
  assert.match(read("../src/app/(shop)/posts/[slug]/page.jsx"), /postServices\.getPublishedPost/);
});

test("public category and brand cards link to their API filter IDs", async () => {
  const categories = read("../src/app/(shop)/categories/page.jsx");
  const brands = read("../src/app/(shop)/brands/page.jsx");
  assert.match(categories, /categoryProductsHref\(category\.id\)/);
  assert.match(brands, /brandProductsHref\(brand\.id\)/);
  const { pathToFileURL } = require("node:url");
  const helper = await import(pathToFileURL(path.join(__dirname, "../src/lib/shopSearch.mjs")).href);
  assert.equal(helper.categoryProductsHref(4), "/products?category_id=4");
  assert.equal(helper.brandProductsHref(9), "/products?brand_id=9");
});

test("public post pagination is driven by URL state for refresh and browser history", () => {
  const page = read("../src/app/(shop)/posts/page.jsx");
  assert.match(page, /useSearchParams\(\)/);
  assert.match(page, /router\.push\(postsPageHref\(target\)\)/);
  assert.match(page, /router\.replace\(postsPageHref\(page\)/);
  assert.match(page, /new AbortController\(\)/);
});
