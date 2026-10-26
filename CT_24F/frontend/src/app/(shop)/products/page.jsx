"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import Pagination from "@/components/common/Pagination";
import productServices from "@/services/productServices";
import categoryServices from "@/services/categoryServices";
import brandServices from "@/services/brandServices";
import {
  flattenShopCategories,
  parseShopProductQuery,
  shopProductHref,
  shopProductRequestParams,
  validateShopProductFilters,
} from "@/lib/shopProductFilters.mjs";

const emptyFilters = { category_id: "", brand_id: "", min_price: "", max_price: "" };

function FilterForm({ prefix, draft, errors, categories, brands, optionErrors, onChange, onApply, onReset }) {
  const missingCategory = draft.category_id && !categories.some((item) => String(item.id) === draft.category_id);
  const missingBrand = draft.brand_id && !brands.some((item) => String(item.id) === draft.brand_id);
  const field = (key, label, control) => <div className="space-y-2" key={key}>
    <label className="block text-sm font-semibold text-[#19352f]" htmlFor={`${prefix}-${key}`}>{label}</label>
    {control}
    {errors[key] && <p className="text-xs text-rose-700" id={`${prefix}-${key}-error`} role="alert">{errors[key]}</p>}
  </div>;
  const inputClass = "min-h-11 w-full rounded-xl border border-[#d8e2da] bg-white px-3 text-sm text-[#19352f] outline-none transition focus:border-[#37665b] focus:ring-2 focus:ring-[#37665b]/15";

  return <form className="space-y-5" noValidate onSubmit={onApply}>
    {field("category_id", "Danh mục", <select aria-describedby={errors.category_id ? `${prefix}-category_id-error` : undefined} aria-invalid={Boolean(errors.category_id)} className={inputClass} id={`${prefix}-category_id`} value={draft.category_id} onChange={(event) => onChange("category_id", event.target.value)}>
      <option value="">Tất cả danh mục</option>
      {missingCategory && <option value={draft.category_id}>Danh mục #{draft.category_id} (không khả dụng)</option>}
      {categories.map((category) => <option key={category.id} value={category.id}>{"— ".repeat(category.depth)}{category.name}</option>)}
    </select>)}
    {optionErrors.category && <p className="-mt-3 text-xs text-amber-800">Không tải được danh mục. Danh sách sản phẩm vẫn hoạt động.</p>}

    {field("brand_id", "Thương hiệu", <select aria-describedby={errors.brand_id ? `${prefix}-brand_id-error` : undefined} aria-invalid={Boolean(errors.brand_id)} className={inputClass} id={`${prefix}-brand_id`} value={draft.brand_id} onChange={(event) => onChange("brand_id", event.target.value)}>
      <option value="">Tất cả thương hiệu</option>
      {missingBrand && <option value={draft.brand_id}>Thương hiệu #{draft.brand_id} (không khả dụng)</option>}
      {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
    </select>)}
    {optionErrors.brand && <p className="-mt-3 text-xs text-amber-800">Không tải được thương hiệu. Danh sách sản phẩm vẫn hoạt động.</p>}

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
      {field("min_price", "Giá từ", <input aria-describedby={errors.min_price ? `${prefix}-min_price-error` : undefined} aria-invalid={Boolean(errors.min_price)} className={inputClass} id={`${prefix}-min_price`} inputMode="decimal" placeholder="0" type="text" value={draft.min_price} onChange={(event) => onChange("min_price", event.target.value)} />)}
      {field("max_price", "Giá đến", <input aria-describedby={errors.max_price ? `${prefix}-max_price-error` : undefined} aria-invalid={Boolean(errors.max_price)} className={inputClass} id={`${prefix}-max_price`} inputMode="decimal" placeholder="10000000" type="text" value={draft.max_price} onChange={(event) => onChange("max_price", event.target.value)} />)}
    </div>
    <p className="text-xs text-slate-500">Nhập số tiền bằng VND, không dùng dấu phân cách hàng nghìn.</p>

    <div className="flex flex-wrap gap-2 pt-1">
      <button className="min-h-11 flex-1 rounded-xl bg-[#193f36] px-4 text-sm font-semibold text-white transition hover:bg-[#2c5e51] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#193f36]" type="submit">Áp dụng</button>
      <button className="min-h-11 rounded-xl border border-[#d8e2da] bg-white px-4 text-sm font-semibold text-[#37665b] transition hover:bg-[#f1f7f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#37665b]" onClick={onReset} type="button">Đặt lại</button>
    </div>
  </form>;
}

function ProductsContent({ queryString, applied }) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => applied.filters);
  const [fieldErrors, setFieldErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [optionErrors, setOptionErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(!applied.error);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const categoryOptions = useMemo(() => flattenShopCategories(categories), [categories]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([categoryServices.getCategories(), brandServices.getBrands()]).then(([categoryResult, brandResult]) => {
      if (!active) return;
      setCategories(categoryResult.status === "fulfilled" ? categoryResult.value.data.data ?? [] : []);
      setBrands(brandResult.status === "fulfilled" ? brandResult.value.data.data ?? [] : []);
      setOptionErrors({ category: categoryResult.status === "rejected", brand: brandResult.status === "rejected" });
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (applied.error) return;
    let active = true;
    const controller = new AbortController();
    productServices.getProducts(shopProductRequestParams(applied.filters, applied.page), { signal: controller.signal })
      .then((response) => {
        if (!active) return;
        setProducts(response.data.data ?? []);
        setMeta(response.data.meta ?? null);
      })
      .catch((requestError) => {
        if (!active || requestError.code === "ERR_CANCELED") return;
        setError(requestError.response?.data?.message ?? "Không tải được sản phẩm. Hãy kiểm tra Laravel API đang chạy.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [applied, reload]);

  const changeDraft = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };
  const refreshProducts = () => {
    setProducts([]);
    setMeta(null);
    setError("");
    setLoading(true);
    setReload((current) => current + 1);
  };
  const applyFilters = (event) => {
    event.preventDefault();
    const validation = validateShopProductFilters(draft);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});
    const target = shopProductHref(validation.filters);
    if (target === `/products${queryString ? `?${queryString}` : ""}`) refreshProducts();
    else router.push(target);
  };
  const resetFilters = () => {
    setDraft(emptyFilters);
    setFieldErrors({});
    if (queryString) router.push("/products");
    else refreshProducts();
  };
  const changePage = (target) => {
    router.push(shopProductHref(applied.filters, target));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const filterProps = { draft, errors: fieldErrors, categories: categoryOptions, brands, optionErrors, onChange: changeDraft, onApply: applyFilters, onReset: resetFilters };

  return <section>
    <div className="mb-8 flex flex-col justify-between gap-5 rounded-[1.75rem] bg-[#eaf1eb] p-8 sm:flex-row sm:items-end sm:p-11">
      <div><p className="eyebrow">Thiết bị cho nhịp sống hiện đại</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#19352f]">Sản phẩm</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Khám phá thiết bị phù hợp với nhu cầu và khoảng giá của bạn.</p></div>
      <div aria-live="polite" className="rounded-2xl bg-white/75 px-5 py-4"><span className="block text-2xl font-semibold text-[#37665b]">{loading ? "—" : meta?.total ?? "—"}</span><span className="text-xs text-slate-500">sản phẩm phù hợp</span></div>
    </div>

    <div className="grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)]">
      <details className="rounded-2xl border border-[#e3ebe4] bg-white p-5 shadow-sm lg:hidden">
        <summary className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-[#193f36]"><SlidersHorizontal aria-hidden="true" size={18} /> Bộ lọc sản phẩm</summary>
        <div className="mt-5 border-t border-[#edf1ed] pt-5"><FilterForm prefix="mobile" {...filterProps} /></div>
      </details>
      <aside aria-label="Bộ lọc sản phẩm" className="sticky top-28 hidden rounded-2xl border border-[#e3ebe4] bg-white p-5 shadow-sm lg:block">
        <div className="mb-5 flex items-center gap-3 border-b border-[#edf1ed] pb-4"><SlidersHorizontal aria-hidden="true" className="text-[#37665b]" size={18} /><h2 className="text-base font-semibold text-[#193f36]">Bộ lọc sản phẩm</h2></div>
        <FilterForm prefix="desktop" {...filterProps} />
      </aside>

      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2"><div><p className="eyebrow">Bộ sưu tập CT_24F</p><h2 className="mt-1 text-xl font-semibold text-[#19352f]">Danh sách sản phẩm</h2></div>{meta && <p className="text-sm text-slate-500">Trang {meta.current_page} / {meta.last_page}</p>}</div>
        {applied.error && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900" role="alert"><p>{applied.error}</p><button className="mt-3 font-semibold underline" onClick={resetFilters} type="button">Xóa bộ lọc không hợp lệ</button></div>}
        {!applied.error && error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800" role="alert"><p>{error}</p><button className="mt-3 font-semibold underline" onClick={refreshProducts} type="button">Thử lại</button></div>}
        {!applied.error && !error && loading && <div aria-live="polite"><p className="mb-4 text-sm text-slate-500" role="status">Đang tải sản phẩm...</p><div aria-hidden="true" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div className="h-72 animate-pulse rounded-[1.4rem] bg-[#edf2ed]" key={index} />)}</div></div>}
        {!applied.error && !error && !loading && products.length === 0 && <div className="rounded-2xl border border-dashed border-[#d6dfd9] p-10 text-center"><p className="text-lg font-semibold text-[#19352f]">Chưa có sản phẩm phù hợp</p><p className="mt-2 text-sm text-slate-500">Hãy thử khoảng giá hoặc danh mục khác.</p><button className="mt-4 text-sm font-semibold text-[#37665b] underline" onClick={resetFilters} type="button">Xem tất cả sản phẩm</button></div>}
        {!applied.error && !error && !loading && products.length > 0 && <><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div><div className="mt-8"><Pagination meta={meta} onPageChange={changePage} /></div></>}
      </div>
    </div>
  </section>;
}

function ProductsRoute() {
  const queryString = useSearchParams().toString();
  const applied = useMemo(() => parseShopProductQuery(new URLSearchParams(queryString)), [queryString]);
  // URL đổi thì remount phần nội dung để draft và kết quả luôn khớp Back/Forward.
  return <ProductsContent applied={applied} key={queryString} queryString={queryString} />;
}

export default function ProductsPage() {
  return <Suspense fallback={<section className="rounded-[1.75rem] bg-[#eaf1eb] p-8 text-sm text-[#37665b]" role="status">Đang tải sản phẩm...</section>}><ProductsRoute /></Suspense>;
}
