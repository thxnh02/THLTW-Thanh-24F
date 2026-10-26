const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const loadFilters = () => import(pathToFileURL(path.join(__dirname, "../src/lib/shopProductFilters.mjs")).href);

test("URL round-trip keeps combined filters and page while a new apply resets page", async () => {
  const { parseShopProductQuery, shopProductHref, shopProductRequestParams } = await loadFilters();
  const url = "/products?category_id=2&brand_id=3&min_price=5000000&max_price=15000000&page=2";
  const parsed = parseShopProductQuery(new URL(url, "http://localhost").searchParams);

  assert.deepEqual(parsed.filters, { category_id: "2", brand_id: "3", min_price: "5000000", max_price: "15000000" });
  assert.equal(parsed.page, 2);
  assert.equal(parsed.error, "");
  assert.deepEqual(shopProductRequestParams(parsed.filters, parsed.page), {
    category_id: "2", brand_id: "3", min_price: "5000000", max_price: "15000000", page: 2,
  });
  assert.equal(shopProductHref(parsed.filters, 2), url);
  assert.equal(shopProductHref({ ...parsed.filters, brand_id: "4" }), "/products?category_id=2&brand_id=4&min_price=5000000&max_price=15000000");
  assert.equal(shopProductHref({ category_id: "", brand_id: "", min_price: "", max_price: "" }), "/products");
});

test("invalid URL IDs, pages, prices and reversed ranges return usable feedback", async () => {
  const { parseShopProductQuery } = await loadFilters();
  for (const [query, message] of [
    ["category_id=abc", "danh mục"],
    ["brand_id=0", "thương hiệu"],
    ["page=0", "trang"],
    ["min_price=-1", "giá"],
    ["max_price=abc", "giá"],
    ["min_price=200&max_price=100", "Giá đến"],
  ]) {
    const parsed = parseShopProductQuery(new URLSearchParams(query));
    assert.match(parsed.error.toLocaleLowerCase("vi-VN"), new RegExp(message.toLocaleLowerCase("vi-VN")));
  }
});

test("form accepts zero price and rejects decimals beyond the schema precision", async () => {
  const { validateShopProductFilters, shopProductHref } = await loadFilters();
  const zero = validateShopProductFilters({ category_id: "", brand_id: "", min_price: "0", max_price: "0" });
  assert.equal(zero.valid, true);
  assert.equal(shopProductHref({ category_id: "", brand_id: "", min_price: "0", max_price: "0" }), "/products?min_price=0&max_price=0");

  const invalid = validateShopProductFilters({ category_id: "", brand_id: "", min_price: "1.123", max_price: "" });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.min_price);
});

test("nested public categories become unique options without dropping children", async () => {
  const { flattenShopCategories } = await loadFilters();
  const categories = [
    { id: 1, name: "Điện tử", children: [{ id: 2, name: "Điện thoại", children: [{ id: 3, name: "Android", children: [] }] }] },
    { id: 2, name: "Điện thoại", children: [] },
  ];
  assert.deepEqual(flattenShopCategories(categories), [
    { id: 1, name: "Điện tử", depth: 0 },
    { id: 2, name: "Điện thoại", depth: 1 },
    { id: 3, name: "Android", depth: 2 },
  ]);
});
