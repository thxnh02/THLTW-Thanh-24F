"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/shop/ProductCard";
import Pagination from "@/components/common/Pagination";
import productServices from "@/services/productServices";
import categoryServices from "@/services/categoryServices";
import brandServices from "@/services/brandServices";

function ProductsContent() {
  const router = useRouter();
  const search = useSearchParams();
  const page = Math.max(1, Number(search.get("page")) || 1);
  const q = search.get("q") ?? "";
  const categoryId = search.get("category_id") ?? "";
  const brandId = search.get("brand_id") ?? "";
  const sort = search.get("sort") ?? "newest";
  const sale = search.get("sale") === "1";
  const minPrice = search.get("min_price") ?? "";
  const maxPrice = search.get("max_price") ?? "";
  const [draft, setDraft] = useState(q);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([categoryServices.getCategories(), brandServices.getBrands()])
      .then(([a, b]) => {
        if (!active) return;
        const flatten = (items) => items.flatMap(item => [item, ...flatten(item.children ?? [])]);
        setCategories(flatten(a.data.data ?? []));
        setBrands(b.data.data ?? []);
      }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    productServices.getProducts({page, q: q || undefined, category_id: categoryId || undefined, brand_id: brandId || undefined, sort, sale: sale ? 1 : undefined, min_price: minPrice || undefined, max_price: maxPrice || undefined})
      .then(r => {if(active) {setProducts(r.data.data ?? []); setMeta(r.data.meta ?? null); setError("");}})
      .catch(e => {if(active) setError(e.response?.data?.message ?? "Không tải được sản phẩm. Kiểm tra Laravel API.");})
      .finally(() => {if(active) setLoading(false);});
    return () => { active = false; };
  }, [page,q,categoryId,brandId,sort,sale,minPrice,maxPrice]);

  const navigate = updates => {
    const params = new URLSearchParams(search.toString());
    Object.entries(updates).forEach(([key,value]) => {
      if (value == null || value === "" || value === false) params.delete(key);
      else params.set(key, String(value));
    });
    router.push("/products" + (params.toString() ? "?" + params : ""));
  };
  return <section className="space-y-7">
    <header className="rounded-[1.75rem] bg-[#eaf1eb] p-7 sm:p-10">
      <p className="eyebrow">Khám phá công nghệ</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#19352f]">Sản phẩm</h1>
      <p className="mt-3 text-sm text-slate-600">Tìm theo tên hoặc SKU, lọc danh mục, thương hiệu và giá bán.</p>
    </header>
    <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="self-start rounded-2xl border border-[#e4eae5] bg-white p-5 lg:sticky lg:top-28">
        <h2 className="mb-4 font-semibold text-[#19352f]">Bộ lọc</h2>
        <form onSubmit={e=>{e.preventDefault();navigate({q:draft.trim(),page:1});}} className="mb-4 flex gap-2">
          <input aria-label="Tìm sản phẩm" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Tên hoặc SKU" className="admin-input min-w-0" />
          <button type="submit" className="rounded-xl bg-[#19352f] px-3 text-sm font-semibold text-white">Tìm</button>
        </form>
        <div className="space-y-4">
          <label className="admin-label">Danh mục<select value={categoryId} className="admin-input" onChange={e=>navigate({category_id:e.target.value,page:1})}><option value="">Tất cả</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="admin-label">Thương hiệu<select value={brandId} className="admin-input" onChange={e=>navigate({brand_id:e.target.value,page:1})}><option value="">Tất cả</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="admin-label">Giá từ<input key={"min"+minPrice} type="number" min="0" defaultValue={minPrice} className="admin-input" name="min_price" id="min_price"/></label>
            <label className="admin-label">Đến<input key={"max"+maxPrice} type="number" min="0" defaultValue={maxPrice} className="admin-input" name="max_price" id="max_price"/></label>
          </div>
          <button type="button" onClick={()=>navigate({min_price:document.getElementById("min_price")?.value ?? "", max_price:document.getElementById("max_price")?.value ?? "",page:1})} className="w-full rounded-xl border border-[#cddcd0] px-4 py-3 text-sm font-semibold">Áp dụng giá</button>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={sale} onChange={e=>navigate({sale:e.target.checked?1:"",page:1})}/> Chỉ sản phẩm giảm giá</label>
          <button type="button" className="text-sm font-semibold text-[#37665b] hover:underline" onClick={()=>{setDraft("");router.push("/products");}}>Xóa bộ lọc</button>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500">{meta ? meta.total + " kết quả" : "Danh sách sản phẩm"}</p><label className="flex items-center gap-2 text-sm">Sắp xếp<select className="rounded-xl border border-[#e4eae5] bg-white p-3" value={sort} onChange={e=>navigate({sort:e.target.value,page:1})}><option value="newest">Mới nhất</option><option value="name">Tên A–Z</option><option value="price_asc">Giá tăng dần</option><option value="price_desc">Giá giảm dần</option></select></label></div>
        {error && <p role="alert" className="mb-5 rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>}
        {loading && !products.length && <p className="rounded-xl bg-white p-8 text-slate-500">Đang tải sản phẩm…</p>}
        {!loading && !error && !products.length && <p className="rounded-xl border border-dashed bg-white p-10 text-center text-slate-500">Không tìm thấy sản phẩm phù hợp.</p>}
        {products.length > 0 && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map(p=><ProductCard product={p} key={p.id}/>)}</div>}
        <Pagination meta={meta} onPageChange={target=>navigate({page:target})}/>
      </div>
    </div>
  </section>;
}


export default function ProductsPage() {
  return <Suspense fallback={<p className="rounded-xl bg-white p-8 text-slate-500">Đang tải bộ lọc…</p>}><ProductsContent /></Suspense>;
}
