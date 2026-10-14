const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const test = require("node:test");

const moduleUrl = pathToFileURL(path.join(__dirname, "../src/lib/slugify.mjs")).href;

test("Vietnamese product, category, and brand names become URL-safe slugs", async () => {
  const { slugify } = await import(moduleUrl);

  assert.equal(slugify("Điện thoại Đẹp"), "dien-thoai-dep");
  assert.equal(slugify("  Tai nghe / Bluetooth  "), "tai-nghe-bluetooth");
  assert.equal(slugify("Áo   thun 2026"), "ao-thun-2026");
  assert.equal(slugify(""), "");
});

test("all catalog forms auto-update slug on name edit and allow manual override", () => {
  for (const type of ["Category", "Brand", "Product"]) {
    const source = readFileSync(path.join(__dirname, `../src/components/admin/${type}Form.jsx`), "utf8");
    assert.match(source, /const \[slugManual, setSlugManual\] = useState\(false\)/);
    assert.match(source, /name === "name" && !slugManual \? \{ slug: slugify\(value\) \}/);
    assert.match(source, /if \(name === "slug"\) setSlugManual\(Boolean\(value\.trim\(\)\)\)/);
    assert.match(source, /<AdminSlugField/);
  }
});
