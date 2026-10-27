const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const loadFilters = () => import(pathToFileURL(path.join(__dirname, "../src/lib/shopProductFilters.mjs")).href);

test("URL round-trip keeps combined filters and page while a new apply resets page", async () => {
  const { parseShopProductQuery, shopProductHref, shopProductRequestParams } = await loadFilters();
  const url = "/products?q=iphone&category_id=2&brand_id=3&min_price=5000000&max_price=15000000&sort=price_asc&sale=1&featured=1&page=2";
  const parsed = parseShopProductQuery(new URL(url, "http://localhost").searchParams);

  assert.deepEqual(parsed.filters, { q: "iphone", category_id: "2", brand_id: "3", min_price: "5000000", max_price: "15000000", sort: "price_asc", sale: "1", featured: "1" });
  assert.equal(parsed.page, 2);
  assert.equal(parsed.error, "");
  assert.deepEqual(shopProductRequestParams(parsed.filters, parsed.page), {
    q: "iphone", category_id: "2", brand_id: "3", min_price: "5000000", max_price: "15000000", sort: "price_asc", sale: "1", featured: "1", page: 2,
  });
  assert.equal(shopProductHref(parsed.filters, 2), url);
  assert.equal(shopProductHref({ ...parsed.filters, brand_id: "4" }), "/products?q=iphone&category_id=2&brand_id=4&min_price=5000000&max_price=15000000&sort=price_asc&sale=1&featured=1");
  assert.equal(shopProductHref({ category_id: "", brand_id: "", min_price: "", max_price: "" }), "/products");
});

test("invalid URL IDs, pages, prices and reversed ranges return usable feedback", async () => {
  const { parseShopProductQuery } = await loadFilters();
  for (const [query, message] of [
    ["category_id=abc", "danh mục"],
    ["brand_id=0", "thương hiệu"],
    ["page=0", "trang"],
    ["q=" + "x".repeat(101), "từ khóa"],
    ["sort=bad", "sắp xếp"],
    ["sort=relevant", "từ khóa"],
    ["sale=2", "tùy chọn"],
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

test("removing one active filter preserves the others and resets pagination", async () => {
  const { removeShopProductFilter, shopProductHref } = await loadFilters();
  const filters = { category_id: "2", brand_id: "3", min_price: "0", max_price: "5000000" };
  const withoutBrand = removeShopProductFilter?.(filters, "brand") ?? {};
  assert.deepEqual(withoutBrand, { q: "", category_id: "2", brand_id: "", min_price: "0", max_price: "5000000", sort: "newest", sale: "", featured: "" });
  assert.equal(shopProductHref(withoutBrand), "/products?category_id=2&min_price=0&max_price=5000000");
  assert.deepEqual(removeShopProductFilter?.(filters, "price") ?? {}, { q: "", category_id: "2", brand_id: "3", min_price: "", max_price: "", sort: "newest", sale: "", featured: "" });
  assert.deepEqual(removeShopProductFilter?.(filters, "category") ?? {}, { q: "", category_id: "", brand_id: "3", min_price: "0", max_price: "5000000", sort: "newest", sale: "", featured: "" });
  assert.deepEqual(filters, { category_id: "2", brand_id: "3", min_price: "0", max_price: "5000000" });
});

test("active filter chips count price as one type and keep missing IDs visible", async () => {
  const { shopFilterCount, shopActiveFilterChips } = await loadFilters();
  const filters = { category_id: "99", brand_id: "3", min_price: "0", max_price: "5000000" };
  assert.equal(shopFilterCount?.(filters) ?? -1, 3);
  assert.deepEqual(shopActiveFilterChips?.(filters, [], [{ id: 3, name: "Apple" }]) ?? [], [
    { type: "category", label: "Danh mục #99" },
    { type: "brand", label: "Apple" },
    { type: "price", label: "0 đ – 5.000.000 đ" },
  ]);
  assert.equal(shopFilterCount?.({ category_id: "", brand_id: "", min_price: "", max_price: "" }) ?? -1, 0);
});

test("slider uses the full catalog bound and expands for a bookmarked higher maximum", async () => {
  const { shopSliderState } = await loadFilters();
  const bounds = { min_price: "750.00", max_price: "100000.00" };
  assert.deepEqual(shopSliderState?.(bounds, { min_price: "", max_price: "" }) ?? {}, {
    disabled: false, min: 0, max: 100000, value: [0, 100000], step: 100,
  });
  assert.deepEqual(shopSliderState?.(bounds, { min_price: "50000", max_price: "150000" }) ?? {}, {
    disabled: false, min: 0, max: 150000, value: [50000, 150000], step: 100,
  });
});

test("empty and unavailable bounds disable only the slider while cheap prices retain precision", async () => {
  const { shopSliderState } = await loadFilters();
  assert.deepEqual(shopSliderState?.({ min_price: null, max_price: null }, { min_price: "", max_price: "" }) ?? {}, {
    disabled: true, min: 0, max: 0, value: [0, 0], step: 1,
  });
  assert.deepEqual(shopSliderState?.(null, { min_price: "5", max_price: "" }) ?? {}, {
    disabled: true, min: 0, max: 5, value: [5, 5], step: 0.01,
  });
  assert.deepEqual(shopSliderState?.({ min_price: "0.00", max_price: "50.00" }, { min_price: "0", max_price: "12.50" }) ?? {}, {
    disabled: false, min: 0, max: 50, value: [0, 12.5], step: 0.01,
  });
});

test("search defaults to relevance and changing or clearing one chip preserves the rest", async () => {
  const { parseShopProductQuery, shopActiveFilterChips, removeShopProductFilter, shopProductHref } = await loadFilters();
  const parsed = parseShopProductQuery(new URLSearchParams("q=iphone&brand_id=3&sale=1"));
  assert.equal(parsed.filters.sort, "relevant");
  const chips = shopActiveFilterChips(parsed.filters, [], [{ id: 3, name: "Apple" }]);
  assert.deepEqual(chips.map(({ type }) => type), ["query", "brand", "sale", "sort"]);
  const withoutQuery = removeShopProductFilter(parsed.filters, "query");
  assert.equal(withoutQuery.sort, "newest");
  assert.equal(shopProductHref(withoutQuery), "/products?brand_id=3&sale=1");
});

test("search URL helper encodes queries and suggestion movement wraps", async () => {
  const { pathToFileURL } = require("node:url");
  const path = require("node:path");
  const { productSearchHref, moveSuggestionIndex, categoryProductsHref, brandProductsHref, postsPageHref, postsPageFromSearch, searchEscapeAction } = await import(pathToFileURL(path.join(__dirname, "../src/lib/shopSearch.mjs")).href);
  assert.equal(productSearchHref("  iPhone 15 pro  "), "/products?q=iPhone%2015%20pro");
  assert.equal(productSearchHref(""), "/products");
  assert.equal(moveSuggestionIndex(-1, 3, 1), 0);
  assert.equal(moveSuggestionIndex(2, 3, 1), 0);
  assert.equal(moveSuggestionIndex(0, 3, -1), 2);
  assert.equal(moveSuggestionIndex(0, 0, 1), -1);
  assert.equal(categoryProductsHref(12), "/products?category_id=12");
  assert.equal(brandProductsHref(7), "/products?brand_id=7");
  assert.equal(postsPageHref(1), "/posts");
  assert.equal(postsPageHref(2), "/posts?page=2");
  assert.equal(postsPageFromSearch("page=2"), 2);
  assert.equal(postsPageFromSearch("page=invalid"), 1);
  assert.equal(searchEscapeAction(true), "close-suggestions");
  assert.equal(searchEscapeAction(false), "close-panel");
});
