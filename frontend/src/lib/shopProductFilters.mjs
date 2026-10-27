const filterKeys = ["category_id", "brand_id", "min_price", "max_price"];
const maxPrice = 9999999999.99;
const sortValues = new Set(["newest", "price_asc", "price_desc", "name_asc", "relevant"]);
const sortLabels = { newest: "Mới nhất", price_asc: "Giá thấp đến cao", price_desc: "Giá cao đến thấp", name_asc: "Tên A–Z", relevant: "Liên quan nhất" };

export const emptyShopProductFilters = Object.freeze({ q: "", category_id: "", brand_id: "", min_price: "", max_price: "", sort: "newest", sale: "", featured: "" });

export function validateShopProductFilters(values) {
  const filters = {
    ...emptyShopProductFilters,
    q: String(values?.q ?? "").trim(),
    ...Object.fromEntries(filterKeys.map((key) => [key, String(values?.[key] ?? "").trim()])),
    sort: String(values?.sort ?? "newest").trim() || "newest",
    sale: String(values?.sale ?? "").trim(),
    featured: String(values?.featured ?? "").trim(),
  };
  const errors = {};

  if (filters.q.length > 100) errors.q = "Từ khóa tìm kiếm tối đa 100 ký tự.";
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
  if (!sortValues.has(filters.sort)) errors.sort = "Cách sắp xếp không hợp lệ.";
  if (filters.sort === "relevant" && !filters.q) errors.sort = "Cần nhập từ khóa để sắp xếp theo độ phù hợp.";
  for (const key of ["sale", "featured"]) {
    if (filters[key] !== "" && filters[key] !== "0" && filters[key] !== "1") errors[key] = "Tùy chọn lọc không hợp lệ.";
  }

  return { valid: Object.keys(errors).length === 0, errors, filters };
}

export function parseShopProductQuery(searchParams) {
  const values = {
    q: searchParams.get("q") ?? "",
    ...Object.fromEntries(filterKeys.map((key) => [key, searchParams.get(key) ?? ""])),
    sort: searchParams.get("sort") ?? (String(searchParams.get("q") ?? "").trim() ? "relevant" : "newest"),
    sale: searchParams.get("sale") ?? "",
    featured: searchParams.get("featured") ?? "",
  };
  const validation = validateShopProductFilters(values);
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
  const normalized = validateShopProductFilters(filters).filters;
  const query = new URLSearchParams();
  if (normalized.q) query.set("q", normalized.q);
  for (const key of filterKeys) if (normalized[key] !== "") query.set(key, normalized[key]);
  if (normalized.sort !== "newest") query.set("sort", normalized.sort);
  if (normalized.sale !== "") query.set("sale", normalized.sale);
  if (normalized.featured !== "") query.set("featured", normalized.featured);
  if (page > 1) query.set("page", String(page));
  return query.size ? `/products?${query.toString()}` : "/products";
}

export function shopProductRequestParams(filters, page = 1) {
  const normalized = validateShopProductFilters(filters).filters;
  const params = {};
  if (normalized.q) params.q = normalized.q;
  for (const key of filterKeys) if (normalized[key] !== "") params[key] = normalized[key];
  if (normalized.sort !== "newest") params.sort = normalized.sort;
  if (normalized.sale !== "") params.sale = normalized.sale;
  if (normalized.featured !== "") params.featured = normalized.featured;
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
  const next = { ...emptyShopProductFilters, ...filters };
  if (type === "category") next.category_id = "";
  if (type === "brand") next.brand_id = "";
  if (type === "price") {
    next.min_price = "";
    next.max_price = "";
  }
  if (type === "query") next.q = "";
  if (type === "sort") next.sort = "newest";
  if (type === "sale") next.sale = "";
  if (type === "featured") next.featured = "";
  if (next.sort === "relevant" && !next.q) next.sort = "newest";
  return next;
}

export function shopFilterCount(filters) {
  return Number(String(filters?.category_id ?? "").trim() !== "")
    + Number(String(filters?.brand_id ?? "").trim() !== "")
    + Number(String(filters?.min_price ?? "").trim() !== "" || String(filters?.max_price ?? "").trim() !== "")
    + Number(filters?.sale === "1")
    + Number(filters?.featured === "1");
}

export function shopActiveFilterChips(filters, categories = [], brands = []) {
  const chips = [];
  if (filters?.q) chips.push({ type: "query", label: `Từ khóa: ${filters.q}` });
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
  if (filters?.sale === "1") chips.push({ type: "sale", label: "Đang khuyến mãi" });
  if (filters?.featured === "1") chips.push({ type: "featured", label: "Sản phẩm nổi bật" });
  if (filters?.sort && filters.sort !== "newest") chips.push({ type: "sort", label: `Sắp xếp: ${sortLabels[filters.sort] ?? filters.sort}` });
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
