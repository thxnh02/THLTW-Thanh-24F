"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import ProductCard from "@/components/shop/ProductCard";
import Pagination from "@/components/common/Pagination";
import productServices from "@/services/productServices";
import categoryServices from "@/services/categoryServices";
import brandServices from "@/services/brandServices";
import {
  flattenShopCategories,
  emptyShopProductFilters,
  parseShopProductQuery,
  removeShopProductFilter,
  shopActiveFilterChips,
  shopFilterCount,
  shopProductHref,
  shopProductRequestParams,
  shopSliderState,
  validateShopProductFilters,
} from "@/lib/shopProductFilters.mjs";

const emptyFilters = emptyShopProductFilters;
const vnd = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
const formatVnd = (value) => vnd.format(Number(value)) + " đ";
const selectClass = "min-h-11 w-full rounded-xl border border-[#d8e2da] bg-white px-3 text-sm text-[#19352f] outline-none focus-visible:border-[#37665b] focus-visible:ring-2 focus-visible:ring-[#37665b]/20";

function FilterSheet({
  appliedFilters, draft, errors, categories, brands, optionErrors,
  bounds, boundsLoading, boundsError, open, onOpenChange, onChange,
  onRangeChange, onApply, onReset,
}) {
  const slider = shopSliderState(bounds, draft);
  const missingCategory = draft.category_id && !categories.some((item) => String(item.id) === draft.category_id);
  const missingBrand = draft.brand_id && !brands.some((item) => String(item.id) === draft.brand_id);
  const filterCount = shopFilterCount(appliedFilters);
  const exceedsCatalog = bounds?.max_price != null && Number(draft.max_price) > Number(bounds.max_price);

  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetTrigger asChild>
      <Button className="min-h-11 gap-2 rounded-xl px-4 text-sm shadow-sm" type="button">
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        Bộ lọc
        {filterCount > 0 && <Badge className="ml-1 bg-white text-[#193f36]" aria-label={filterCount + " loại bộ lọc đang áp dụng"}>{filterCount}</Badge>}
      </Button>
    </SheetTrigger>
    <SheetContent className="data-[side=right]:w-full max-w-[420px] gap-0 border-[#d8e2da] sm:max-w-[420px]" side="right">
      <SheetHeader className="shrink-0 border-b border-[#e3ebe4] px-5 py-5 pr-14">
        <SheetTitle className="text-xl font-semibold text-[#19352f]">Bộ lọc sản phẩm</SheetTitle>
        <SheetDescription>Chọn danh mục, thương hiệu và khoảng giá phù hợp.</SheetDescription>
      </SheetHeader>
      <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={onApply}>
        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#19352f]" htmlFor="shop-category">Danh mục</label>
            <select aria-describedby={errors.category_id ? "shop-category-error" : undefined} aria-invalid={Boolean(errors.category_id)} className={selectClass} id="shop-category" value={draft.category_id} onChange={(event) => onChange("category_id", event.target.value)}>
              <option value="">Tất cả danh mục</option>
              {missingCategory && <option value={draft.category_id}>Danh mục #{draft.category_id} (không khả dụng)</option>}
              {categories.map((item) => <option key={item.id} value={item.id}>{"— ".repeat(item.depth)}{item.name}</option>)}
            </select>
            {errors.category_id && <p className="text-xs text-rose-700" id="shop-category-error" role="alert">{errors.category_id}</p>}
            {optionErrors.category && <p className="text-xs text-amber-800">Không tải được danh mục. Bạn vẫn có thể lọc theo giá.</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#19352f]" htmlFor="shop-brand">Thương hiệu</label>
            <select aria-describedby={errors.brand_id ? "shop-brand-error" : undefined} aria-invalid={Boolean(errors.brand_id)} className={selectClass} id="shop-brand" value={draft.brand_id} onChange={(event) => onChange("brand_id", event.target.value)}>
              <option value="">Tất cả thương hiệu</option>
              {missingBrand && <option value={draft.brand_id}>Thương hiệu #{draft.brand_id} (không khả dụng)</option>}
              {brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            {errors.brand_id && <p className="text-xs text-rose-700" id="shop-brand-error" role="alert">{errors.brand_id}</p>}
            {optionErrors.brand && <p className="text-xs text-amber-800">Không tải được thương hiệu. Bạn vẫn có thể lọc theo giá.</p>}
          </div>

          <div className="space-y-5 border-t border-[#edf1ed] pt-6">
            <div>
              <h3 className="text-sm font-semibold text-[#19352f]">Khoảng giá</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500" id="shop-price-hint">
                {boundsLoading ? "Đang tải khoảng giá sản phẩm..." : boundsError ? "Không tải được khoảng giá. Bạn vẫn có thể nhập giá bên dưới." : slider.disabled ? "Chưa có sản phẩm để chọn bằng thanh giá. Bạn vẫn có thể nhập giá." : "Giá sản phẩm hiện có: " + formatVnd(bounds.min_price) + " – " + formatVnd(bounds.max_price)}
              </p>
              {exceedsCatalog && <p className="mt-1 text-xs text-amber-800">Giá đã chọn cao hơn catalog hiện tại; lựa chọn của bạn vẫn được giữ.</p>}
            </div>
            <div className="px-1">
              <Slider aria-describedby="shop-price-hint" className="py-4" disabled={slider.disabled} max={slider.max} min={slider.min} onValueChange={onRangeChange} step={slider.step} thumbLabels={["Giá từ", "Giá đến"]} value={slider.value} />
              <div className="mt-1 flex justify-between gap-3 text-xs text-[#587168]">
                <span>{formatVnd(slider.min)}</span>
                <span>{formatVnd(slider.max)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#19352f]" htmlFor="shop-min-price">Giá từ</label>
                <Input aria-describedby={errors.min_price ? "shop-min-price-error" : undefined} aria-invalid={Boolean(errors.min_price)} className="min-h-11 rounded-xl bg-white" id="shop-min-price" inputMode="decimal" maxLength={14} placeholder="0" type="text" value={draft.min_price} onChange={(event) => onChange("min_price", event.target.value)} />
                {errors.min_price && <p className="text-xs text-rose-700" id="shop-min-price-error" role="alert">{errors.min_price}</p>}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#19352f]" htmlFor="shop-max-price">Giá đến</label>
                <Input aria-describedby={errors.max_price ? "shop-max-price-error" : undefined} aria-invalid={Boolean(errors.max_price)} className="min-h-11 rounded-xl bg-white" id="shop-max-price" inputMode="decimal" maxLength={14} placeholder="10000000" type="text" value={draft.max_price} onChange={(event) => onChange("max_price", event.target.value)} />
                {errors.max_price && <p className="text-xs text-rose-700" id="shop-max-price-error" role="alert">{errors.max_price}</p>}
              </div>
            </div>
            <p className="text-xs leading-5 text-slate-500">Nhập số tiền bằng VND, không dùng dấu phân cách hàng nghìn. Để trống nếu không giới hạn.</p>
          </div>
        </div>
        <SheetFooter className="shrink-0 flex-row gap-3 border-t border-[#e3ebe4] bg-white p-4">
          <Button className="min-h-11 flex-1 rounded-xl" onClick={onReset} type="button" variant="outline">Đặt lại</Button>
          <Button className="min-h-11 flex-1 rounded-xl" type="submit">Áp dụng</Button>
        </SheetFooter>
      </form>
    </SheetContent>
  </Sheet>;
}

function ProductsContent({ queryString, applied, categories, brands, optionErrors, bounds, boundsLoading, boundsError }) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState(() => ({ ...applied.filters }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(!applied.error);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const categoryOptions = useMemo(() => flattenShopCategories(categories), [categories]);
  const chips = useMemo(() => shopActiveFilterChips(applied.filters, categoryOptions, brands), [applied.filters, categoryOptions, brands]);

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

  const changeSheetOpen = (nextOpen) => {
    if (nextOpen) {
      setDraft({ ...applied.filters });
      setFieldErrors({});
    }
    setSheetOpen(nextOpen);
  };
  const changeDraft = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };
  const changeRange = ([min, max]) => {
    setDraft((current) => ({ ...current, min_price: String(min), max_price: String(max) }));
    setFieldErrors((current) => ({ ...current, min_price: undefined, max_price: undefined }));
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
    const validation = validateShopProductFilters({ ...applied.filters, ...draft });
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});
    setSheetOpen(false);
    const target = shopProductHref(validation.filters);
    const currentUrl = "/products" + (queryString ? "?" + queryString : "");
    if (target !== currentUrl) router.push(target);
    else if (error) refreshProducts();
  };
  const resetFilters = () => {
    const next = { ...applied.filters, category_id: "", brand_id: "", min_price: "", max_price: "" };
    setDraft(next);
    setFieldErrors({});
    setSheetOpen(false);
    const target = shopProductHref(next);
    if (target !== "/products" + (queryString ? "?" + queryString : "")) router.push(target);
    else if (error) refreshProducts();
  };
  const clearAll = () => {
    setDraft({ ...emptyFilters });
    setFieldErrors({});
    setSheetOpen(false);
    if (queryString) router.push("/products");
    else if (error) refreshProducts();
  };
  const changeSort = (sort) => {
    const next = { ...applied.filters, sort };
    if (sort === "relevant" && !next.q) return;
    router.push(shopProductHref(next));
  };
  const removeChip = (type) => router.push(shopProductHref(removeShopProductFilter(applied.filters, type)));
  const changePage = (page) => {
    router.push(shopProductHref(applied.filters, page));
    window.scrollTo(0, 0);
  };

  return <section>
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-2xl font-semibold tracking-tight text-[#19352f]">{applied.filters.q ? "Kết quả tìm kiếm" : "Sản phẩm"}</h1>{applied.filters.q && <p className="mt-1 max-w-xl break-words text-sm text-slate-600">Kết quả cho “{applied.filters.q}”</p>}</div>
        {meta && <p className="text-sm text-slate-500">{meta.total} sản phẩm · Trang {meta.current_page} / {meta.last_page}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <label className="sr-only" htmlFor="product-sort">Sắp xếp sản phẩm</label>
        <select className={selectClass + " min-h-11 w-auto min-w-40 rounded-xl"} id="product-sort" onChange={(event) => changeSort(event.target.value)} value={applied.filters.sort}>
          {applied.filters.q && <option value="relevant">Liên quan nhất</option>}
          <option value="newest">Mới nhất</option><option value="price_asc">Giá thấp đến cao</option><option value="price_desc">Giá cao đến thấp</option><option value="name_asc">Tên A–Z</option>
        </select>
        <FilterSheet appliedFilters={applied.filters} bounds={bounds} boundsError={boundsError} boundsLoading={boundsLoading} brands={brands} categories={categoryOptions} draft={draft} errors={fieldErrors} onApply={applyFilters} onChange={changeDraft} onOpenChange={changeSheetOpen} onRangeChange={changeRange} onReset={resetFilters} open={sheetOpen} optionErrors={optionErrors} />
      </div>
    </div>

    {chips.length > 0 && <div aria-label="Bộ lọc đang áp dụng" className="mb-6 flex flex-wrap items-center gap-2">
      {chips.map((chip) => <Badge className="h-auto max-w-full gap-2 rounded-full border-[#d8e2da] bg-white px-3 py-2 text-xs text-[#193f36]" key={chip.type} variant="outline">
        <span className="truncate">{chip.label}</span>
        <button aria-label={"Xóa bộ lọc " + chip.label} className="grid size-5 shrink-0 place-items-center rounded-full hover:bg-[#eaf1eb] focus-visible:outline-2 focus-visible:outline-[#37665b]" onClick={() => removeChip(chip.type)} type="button"><X aria-hidden="true" className="size-3" /></button>
      </Badge>)}
      <Button className="min-h-9 px-2 text-[#37665b]" onClick={clearAll} type="button" variant="ghost">Xóa tất cả</Button>
    </div>}

    {applied.error && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900" role="alert"><p>{applied.error}</p><button className="mt-3 font-semibold underline" onClick={clearAll} type="button">Xóa tiêu chí không hợp lệ</button></div>}
    {!applied.error && error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800" role="alert"><p>{error}</p><button className="mt-3 font-semibold underline" onClick={refreshProducts} type="button">Thử lại</button></div>}
    {!applied.error && !error && loading && <div aria-live="polite"><p className="mb-4 text-sm text-slate-500" role="status">Đang tải sản phẩm...</p><div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{Array.from({ length: 6 }, (_, index) => <Skeleton className="h-60 rounded-2xl" key={index} />)}</div></div>}
    {!applied.error && !error && !loading && products.length === 0 && <div className="rounded-2xl border border-dashed border-[#d6dfd9] p-10 text-center"><p className="text-lg font-semibold text-[#19352f]">Chưa có sản phẩm phù hợp</p><p className="mt-2 text-sm text-slate-500">{applied.filters.q ? "Thử từ khóa ngắn hơn hoặc kiểm tra chính tả." : "Hãy thử khoảng giá hoặc danh mục khác."}</p><button className="mt-4 text-sm font-semibold text-[#37665b] underline" onClick={clearAll} type="button">Xem tất cả sản phẩm</button></div>}
    {!applied.error && !error && !loading && products.length > 0 && <><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div><div className="mt-6"><Pagination meta={meta} onPageChange={changePage} /></div></>}
  </section>;
}

function ProductsRoute() {
  const queryString = useSearchParams().toString();
  const applied = useMemo(() => parseShopProductQuery(new URLSearchParams(queryString)), [queryString]);
  const [options, setOptions] = useState({ categories: [], brands: [], errors: { category: false, brand: false } });
  const [bounds, setBounds] = useState(null);
  const [boundsLoading, setBoundsLoading] = useState(true);
  const [boundsError, setBoundsError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([categoryServices.getCategories(), brandServices.getBrands()]).then(([categoryResult, brandResult]) => {
      if (!active) return;
      const categories = categoryResult.status === "fulfilled" ? categoryResult.value.data?.data : null;
      const brands = brandResult.status === "fulfilled" ? brandResult.value.data?.data : null;
      setOptions({
        categories: Array.isArray(categories) ? categories : [],
        brands: Array.isArray(brands) ? brands : [],
        errors: { category: !Array.isArray(categories), brand: !Array.isArray(brands) },
      });
    });
    productServices.getPublicPriceRange()
      .then((response) => {
        if (!active) return;
        const range = response.data?.data;
        if (!range || !Object.hasOwn(range, "min_price") || !Object.hasOwn(range, "max_price")) {
          setBoundsError(true);
          return;
        }
        setBounds(range);
      })
      .catch(() => { if (active) setBoundsError(true); })
      .finally(() => { if (active) setBoundsLoading(false); });
    return () => { active = false; };
  }, []);

  // URL đổi thì remount phần kết quả; dữ liệu tùy chọn và khoảng giá vẫn chỉ tải một lần.
  return <ProductsContent applied={applied} bounds={bounds} boundsError={boundsError} boundsLoading={boundsLoading} brands={options.brands} categories={options.categories} key={queryString} optionErrors={options.errors} queryString={queryString} />;
}

export default function ProductsPage() {
  return <Suspense fallback={<section className="rounded-[1.75rem] bg-[#eaf1eb] p-8 text-sm text-[#37665b]" role="status">Đang tải sản phẩm...</section>}><ProductsRoute /></Suspense>;
}
