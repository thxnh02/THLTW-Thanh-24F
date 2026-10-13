"use client";

import { ChevronLeft, ChevronRight, Filter, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ProductCard } from "@/components/shop/product/ProductCard";
import { Button, EmptyState, ErrorState, Input, Select, Sheet, SheetContent, SheetHeader, SheetTitle, Skeleton } from "@/components/ui";
import { apiGetList, apiGetResponse } from "@/lib/api";
import type { Brand, Category, PaginatedMeta, Product } from "@/types/api";

type FilterState = { q: string; category: string; brand: string; min_price: string; max_price: string; sort: string; page: string };

function initialQuery(): FilterState {
  if (typeof window === "undefined") return { q: "", category: "", brand: "", min_price: "", max_price: "", sort: "newest", page: "1" };
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get("q") || "",
    category: params.get("category") || "",
    brand: params.get("brand") || "",
    min_price: params.get("min_price") || "",
    max_price: params.get("max_price") || "",
    sort: params.get("sort") || "newest",
    page: params.get("page") || "1",
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({});
  const [query, setQuery] = useState<FilterState>(initialQuery);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => value && params.set(key, value));
    return params.toString();
  }, [query]);

  useEffect(() => {
    Promise.all([apiGetList<Category>("/categories"), apiGetList<Brand>("/brands")])
      .then(([categoryData, brandData]) => {
        setCategories(categoryData);
        setBrands(brandData);
      })
      .catch(() => setError("Không thể tải bộ lọc sản phẩm."));
  }, []);

  useEffect(() => {
    let active = true;
    window.history.replaceState(null, "", queryString ? `/products?${queryString}` : "/products");
    apiGetResponse<Product[]>(`/products?${queryString}`)
      .then(({ data, meta: responseMeta }) => {
        if (!active) return;
        setProducts(data);
        setMeta(responseMeta as PaginatedMeta);
      })
      .catch(() => active && setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [queryString, reload]);

  const updateFilter = (key: keyof FilterState, value: string) => {
    setLoading(true);
    setError("");
    setQuery((current) => ({ ...current, [key]: value, page: key === "page" ? value : "1" }));
  };
  const clearFilters = () => {
    setLoading(true);
    setError("");
    setQuery({ q: "", category: "", brand: "", min_price: "", max_price: "", sort: "newest", page: "1" });
  };
  const activeFilters = [
    ["q", query.q],
    ["category", categories.find((item) => item.slug === query.category)?.name || ""],
    ["brand", brands.find((item) => item.slug === query.brand)?.name || ""],
    ["min_price", query.min_price ? `Từ ${query.min_price}` : ""],
    ["max_price", query.max_price ? `Đến ${query.max_price}` : ""],
  ] as const;

  const filters = <ProductFilters categories={categories} brands={brands} query={query} onChange={updateFilter} onClear={clearFilters} />;

  return (
    <main className="page-shell py-8 sm:py-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.1em] text-teal-700">Cửa hàng</p>
          <h1 className="mt-1 text-3xl font-black tracking-normal text-slate-950">Sản phẩm</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Tìm thiết bị phù hợp theo danh mục, thương hiệu và mức giá bạn mong muốn.</p>
        </div>
        <Button variant="secondary" className="lg:hidden" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={17} aria-hidden="true" />Bộ lọc</Button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm text-slate-600">{loading ? "Đang cập nhật..." : `${meta.total ?? products.length} sản phẩm`}</p>
        {activeFilters.filter(([, value]) => value).map(([key, value]) => <button key={key} type="button" onClick={() => updateFilter(key as keyof FilterState, "")} className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100">{value}<X size={13} aria-hidden="true" /></button>)}
        {activeFilters.some(([, value]) => value) ? <button type="button" onClick={clearFilters} className="px-2 py-1 text-xs font-semibold text-slate-600 underline underline-offset-2 hover:text-slate-950">Xóa bộ lọc</button> : null}
      </div>

      <div className="grid gap-7 lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-lg border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)]">{filters}</div>
        </aside>
        <section aria-live="polite">
          {error ? <ErrorState message={error} onRetry={() => { setLoading(true); setError(""); setReload((value) => value + 1); }} /> : loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-[410px]" />)}</div> : products.length === 0 ? <EmptyState title="Không tìm thấy sản phẩm" message="Hãy thử thay đổi từ khóa hoặc bộ lọc của bạn." action={<Button variant="secondary" onClick={clearFilters}>Xóa bộ lọc</Button>} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
          <Pagination page={Number(query.page)} lastPage={Number(meta.last_page ?? 1)} loading={loading} onPage={(page) => updateFilter("page", String(page))} />
        </section>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
          <SheetHeader className="border-b border-[var(--border)] px-5 py-5"><SheetTitle className="flex items-center gap-2"><Filter size={18} aria-hidden="true" />Bộ lọc sản phẩm</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-5">{filters}</div>
          <div className="border-t border-[var(--border)] p-4"><Button className="w-full" onClick={() => setFiltersOpen(false)}>Xem kết quả</Button></div>
        </SheetContent>
      </Sheet>
    </main>
  );
}

function ProductFilters({ categories, brands, query, onChange, onClear }: { categories: Category[]; brands: Brand[]; query: FilterState; onChange: (key: keyof FilterState, value: string) => void; onClear: () => void }) {
  return <div className="space-y-4"><div className="flex items-center justify-between"><h2 className="font-bold text-slate-950">Lọc sản phẩm</h2><button type="button" onClick={onClear} className="text-xs font-semibold text-teal-800 hover:underline">Đặt lại</button></div><label className="block text-sm font-semibold text-slate-700">Từ khóa<Input value={query.q} onChange={(event) => onChange("q", event.target.value)} className="mt-1.5" placeholder="Tên hoặc mã sản phẩm" /></label><label className="block text-sm font-semibold text-slate-700">Danh mục<Select value={query.category} onChange={(event) => onChange("category", event.target.value)} className="mt-1.5"><option value="">Tất cả danh mục</option>{categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</Select></label><label className="block text-sm font-semibold text-slate-700">Thương hiệu<Select value={query.brand} onChange={(event) => onChange("brand", event.target.value)} className="mt-1.5"><option value="">Tất cả thương hiệu</option>{brands.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</Select></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-semibold text-slate-700">Giá từ<Input type="number" min="0" value={query.min_price} onChange={(event) => onChange("min_price", event.target.value)} className="mt-1.5" /></label><label className="block text-sm font-semibold text-slate-700">Giá đến<Input type="number" min="0" value={query.max_price} onChange={(event) => onChange("max_price", event.target.value)} className="mt-1.5" /></label></div><label className="block text-sm font-semibold text-slate-700">Sắp xếp<Select value={query.sort} onChange={(event) => onChange("sort", event.target.value)} className="mt-1.5"><option value="newest">Mới nhất</option><option value="price_asc">Giá tăng dần</option><option value="price_desc">Giá giảm dần</option><option value="best_selling">Bán chạy</option></Select></label></div>;
}

function Pagination({ page, lastPage, loading, onPage }: { page: number; lastPage: number; loading: boolean; onPage: (page: number) => void }) {
  if (lastPage <= 1) return null;
  return <div className="mt-7 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-5 text-sm text-slate-600"><span>Trang {page} / {lastPage}</span><div className="flex gap-2"><Button variant="secondary" className="min-h-10 px-3" disabled={page <= 1 || loading} onClick={() => onPage(page - 1)} title="Trang trước"><ChevronLeft size={17} aria-hidden="true" /></Button><Button variant="secondary" className="min-h-10 px-3" disabled={page >= lastPage || loading} onClick={() => onPage(page + 1)} title="Trang sau"><ChevronRight size={17} aria-hidden="true" /></Button></div></div>;
}
