"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { ProductCard } from "@/components/ProductCard";
import { apiGet } from "@/lib/api";
import type { Brand, Category, PaginatedMeta, Product } from "@/types/api";

type ProductsResponse = Product[];

function getInitialQuery() {
  if (typeof window === "undefined") {
    return {
      q: "",
      category: "",
      brand: "",
      min_price: "",
      max_price: "",
      sort: "newest",
      page: "1",
    };
  }

  const params = new URLSearchParams(window.location.search);

  return {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    brand: params.get("brand") ?? "",
    min_price: params.get("min_price") ?? "",
    max_price: params.get("max_price") ?? "",
    sort: params.get("sort") ?? "newest",
    page: params.get("page") ?? "1",
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState(getInitialQuery);

  useEffect(() => {
    Promise.all([apiGet<Category[]>("/categories"), apiGet<Brand[]>("/brands")])
      .then(([categoryData, brandData]) => {
        setCategories(categoryData);
        setBrands(brandData);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    return params.toString();
  }, [query]);

  useEffect(() => {
    window.history.replaceState(null, "", queryString ? `/products?${queryString}` : "/products");
    apiGet<ProductsResponse>(`/products?${queryString}`)
      .then((data) => {
        setProducts(data);
        return fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/products?${queryString}`);
      })
      .then((response) => response.json())
      .then((json) => setMeta(json.meta ?? {}))
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [queryString]);

  function updateFilter(key: keyof typeof query, value: string) {
    setLoading(true);
    setError("");
    setQuery((current) => ({ ...current, [key]: value, page: key === "page" ? value : "1" }));
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-950">San pham</h1>
        <p className="mt-2 text-slate-600">Loc theo danh muc, thuong hieu, gia va sap xep bang query URL.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Tu khoa
              <input
                value={query.q}
                onChange={(event) => updateFilter("q", event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950"
                placeholder="iPhone, SKU..."
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Danh muc
              <select
                value={query.category}
                onChange={(event) => updateFilter("category", event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950"
              >
                <option value="">Tat ca</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Thuong hieu
              <select
                value={query.brand}
                onChange={(event) => updateFilter("brand", event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950"
              >
                <option value="">Tat ca</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.slug}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-semibold text-slate-700">
                Gia tu
                <input
                  type="number"
                  value={query.min_price}
                  onChange={(event) => updateFilter("min_price", event.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Den
                <input
                  type="number"
                  value={query.max_price}
                  onChange={(event) => updateFilter("max_price", event.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950"
                />
              </label>
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Sap xep
              <select
                value={query.sort}
                onChange={(event) => updateFilter("sort", event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950"
              >
                <option value="newest">Moi nhat</option>
                <option value="price_asc">Gia tang dan</option>
                <option value="price_desc">Gia giam dan</option>
                <option value="best_selling">Ban chay</option>
              </select>
            </label>
          </div>
        </aside>

        <section>
          {loading ? <Panel>Dang tai san pham...</Panel> : null}
          {error ? <Panel>{error}</Panel> : null}
          {!loading && !error && products.length === 0 ? <Panel>Khong co san pham phu hop.</Panel> : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between rounded-md border border-slate-200 bg-white p-3 text-sm">
            <span>
              Trang {meta.current_page ?? query.page} / {meta.last_page ?? 1}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={Number(query.page) <= 1}
                onClick={() => updateFilter("page", String(Number(query.page) - 1))}
                className="rounded-md border border-slate-300 px-3 py-2 disabled:opacity-50"
              >
                Truoc
              </button>
              <button
                type="button"
                disabled={Number(query.page) >= Number(meta.last_page ?? 1)}
                onClick={() => updateFilter("page", String(Number(query.page) + 1))}
                className="rounded-md border border-slate-300 px-3 py-2 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="mb-4 rounded-md border border-slate-200 bg-white p-4 text-slate-700">{children}</div>;
}
