const filterKeys = ["category_id", "brand_id", "min_price", "max_price"];
const maxPrice = 9999999999.99;

export function validateShopProductFilters(values) {
  const filters = Object.fromEntries(filterKeys.map((key) => [key, String(values?.[key] ?? "").trim()]));
  const errors = {};

  for (const [key, label] of [["category_id", "danh mục"], ["brand_id", "thương hiệu"]]) {
    const value = filters[key];
    if (value && (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)))) {
      errors[key] = `Mã ${label} không hợp lệ.`;
    }
  }

  for (const [key, label] of [["min_price", "Giá từ"], ["max_price", "Giá đến"]]) {
    const value = filters[key];
    if (value && (!/^\d+(?:\.\d{1,2})?$/.test(value) || Number(value) > maxPrice)) {
      errors[key] = `${label} phải là số không âm, tối đa 2 chữ số thập phân.`;
    }
  }

  if (!errors.min_price && !errors.max_price && filters.min_price !== "" && filters.max_price !== "" && Number(filters.min_price) > Number(filters.max_price)) {
    errors.max_price = "Giá đến phải lớn hơn hoặc bằng Giá từ.";
  }

  return { valid: Object.keys(errors).length === 0, errors, filters };
}

export function parseShopProductQuery(searchParams) {
  const filters = Object.fromEntries(filterKeys.map((key) => [key, searchParams.get(key) ?? ""]));
  const validation = validateShopProductFilters(filters);
  const rawPage = searchParams.get("page");
  const validPage = rawPage == null || (/^[1-9]\d*$/.test(rawPage) && Number.isSafeInteger(Number(rawPage)));
  const errors = validPage ? validation.errors : { ...validation.errors, page: "Số trang không hợp lệ." };

  return {
    filters: validation.filters,
    page: validPage && rawPage != null ? Number(rawPage) : 1,
    errors,
    error: Object.values(errors)[0] ?? "",
  };
}

export function shopProductHref(filters, page = 1) {
  const query = new URLSearchParams();
  for (const key of filterKeys) {
    const value = String(filters?.[key] ?? "").trim();
    if (value !== "") query.set(key, value);
  }
  if (page > 1) query.set("page", String(page));
  return query.size ? `/products?${query.toString()}` : "/products";
}

export function shopProductRequestParams(filters, page = 1) {
  const params = {};
  for (const key of filterKeys) {
    const value = String(filters?.[key] ?? "").trim();
    if (value !== "") params[key] = value;
  }
  params.page = page;
  return params;
}

export function flattenShopCategories(categories) {
  const options = [];
  const seen = new Set();
  const visit = (items, depth) => {
    for (const category of items ?? []) {
      const id = String(category.id ?? "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      options.push({ id: category.id, name: category.name, depth });
      visit(category.children, depth + 1);
    }
  };
  visit(categories, 0);
  return options;
}

export function removeShopProductFilter(filters, type) {
  const next = { ...filters };
  if (type === "category") next.category_id = "";
  if (type === "brand") next.brand_id = "";
  if (type === "price") {
    next.min_price = "";
    next.max_price = "";
  }
  return next;
}

export function shopFilterCount(filters) {
  return Number(String(filters?.category_id ?? "").trim() !== "")
    + Number(String(filters?.brand_id ?? "").trim() !== "")
    + Number(String(filters?.min_price ?? "").trim() !== "" || String(filters?.max_price ?? "").trim() !== "");
}

export function shopActiveFilterChips(filters, categories, brands) {
  const chips = [];
  if (filters?.category_id) {
    const category = categories.find((item) => String(item.id) === String(filters.category_id));
    chips.push({ type: "category", label: category?.name ?? `Danh mục #${filters.category_id}` });
  }
  if (filters?.brand_id) {
    const brand = brands.find((item) => String(item.id) === String(filters.brand_id));
    chips.push({ type: "brand", label: brand?.name ?? `Thương hiệu #${filters.brand_id}` });
  }
  if (filters?.min_price !== "" || filters?.max_price !== "") {
    const format = (value) => {
      const amount = Number(value);
      return `${Number.isFinite(amount) ? new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(amount) : value} đ`;
    };
    const low = filters?.min_price !== "" ? format(filters.min_price) : null;
    const high = filters?.max_price !== "" ? format(filters.max_price) : null;
    chips.push({ type: "price", label: low && high ? `${low} – ${high}` : low ? `Từ ${low}` : `Đến ${high}` });
  }
  return chips;
}

export function shopSliderState(bounds, filters) {
  const catalogMax = bounds?.max_price == null ? null : Number(bounds.max_price);
  const hasCatalog = catalogMax !== null && Number.isFinite(catalogMax) && catalogMax >= 0;
  const readPrice = (value) => {
    if (value === "" || value == null) return null;
    const price = Number(value);
    return Number.isFinite(price) && price >= 0 && price <= maxPrice ? price : null;
  };
  const selectedMin = readPrice(filters?.min_price);
  const selectedMax = readPrice(filters?.max_price);
  const max = Math.max(hasCatalog ? catalogMax : 0, selectedMin ?? 0, selectedMax ?? 0);
  const lower = Math.min(selectedMin ?? 0, max);
  const upper = Math.max(lower, Math.min(selectedMax ?? max, max));
  const step = max === 0 ? 1 : max < 100 ? 0.01 : Math.max(1, Math.min(1000, 10 ** (Math.floor(Math.log10(max)) - 3)));

  return { disabled: !hasCatalog || max === 0, min: 0, max, value: [lower, upper], step };
}
