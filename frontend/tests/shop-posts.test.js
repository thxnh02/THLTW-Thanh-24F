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
