"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import AdminTable from "@/components/admin/AdminTable";
import AdminRowActions from "@/components/admin/AdminRowActions";
import AdminCatalogThumbnail from "@/components/admin/AdminCatalogThumbnail";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "@/components/admin/StatusBadge";
import Pagination from "@/components/common/Pagination";
import productServices from "@/services/productServices";
import categoryServices from "@/services/categoryServices";

const money = (v) => Number(v ?? 0).toLocaleString("vi-VN") + " đ";

export default function AdminProductsPage() {
  const router = useRouter();
  const search = useSearchParams();
  const page = Math.max(1, Number(search.get("page")) || 1);
  const keyword = search.get("keyword") ?? "";
  const categoryId = search.get("category_id") ?? "";
  const perPage = [5, 10, 20].includes(Number(search.get("per_page"))) ? Number(search.get("per_page")) : 10;
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trashCount, setTrashCount] = useState(null);
  const [draft, setDraft] = useState(keyword);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => { setDraft(keyword); }, [keyword]);
  useEffect(() => {
    let active = true;
    categoryServices.getAdminCategoryOptions().then(r => { if(active) setCategories(r.data.data ?? []); }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    productServices.getProductTrash({ per_page: 1 }).then(r => { if(active) setTrashCount(r.data.meta?.total ?? 0); }).catch(() => {});
    return () => { active = false; };
  }, [reload]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    productServices.getAdminProducts({ page, keyword: keyword || undefined, category_id: categoryId || undefined, per_page: perPage })
      .then(r => { if(active) { setData(r.data.data ?? []); setMeta(r.data.meta ?? null); setError(""); } })
      .catch(e => { if(active) setError(e.response?.data?.message ?? "Không tải được sản phẩm."); })
      .finally(() => { if(active) setLoading(false); });
    return () => { active = false; };
  }, [page, keyword, categoryId, perPage, reload]);

  const navigate = (updates) => {
    const q = new URLSearchParams(search.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === "" || value == null) q.delete(key); else q.set(key, String(value));
    }
    router.push("/admin/product" + (q.toString() ? "?" + q : ""));
  };

  const columns = [
    { key: "product", label: "Sản phẩm", render: (item) => <div className="flex min-w-48 items-center gap-3"><AdminCatalogThumbnail label="sản phẩm" src={item.image} /><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{item.name}</p><p className="text-xs text-slate-500">{item.sku || item.slug}</p></div></div> },
    { key: "category", label: "Danh mục", render: (item) => item.category?.name ?? "—" },
    { key: "brand", label: "Thương hiệu", render: (item) => item.brand?.name ?? "—" },
    { key: "price", label: "Giá", render: (item) => <div><p className="font-semibold">{money(item.sale_price ?? item.price)}</p>{item.sale_price != null && <p className="text-xs text-slate-400 line-through">{money(item.price)}</p>}</div> },
    { key: "quantity", label: "Tồn kho", render: (item) => <span className={Number(item.quantity) === 0 ? "font-semibold text-rose-700" : ""}>{Number(item.quantity) === 0 ? "Hết hàng" : item.quantity ?? "—"}</span> },
    { key: "status", label: "Hiển thị", render: (item) => <StatusBadge status={item.status} /> },
  ];
  return <section className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-700">Quản lý hàng hóa</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Sản phẩm</h1><p className="mt-2 text-sm text-slate-600">Tìm kiếm, phân loại và cập nhật sản phẩm theo dữ liệu MySQL.</p></div><div className="flex gap-2"><Link className="rounded-xl border bg-white px-4 py-3 text-sm font-semibold" href="/admin/product/trash">Thùng rác{trashCount !== null ? ` (${trashCount})` : ""}</Link><Link className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white" href="/admin/product/create">+ Thêm sản phẩm</Link></div></div>
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_minmax(170px,220px)_auto]">
      <form className="flex items-center gap-2 rounded-xl border border-slate-200 px-3" onSubmit={e => {e.preventDefault();navigate({keyword:draft.trim(),page:1});}}><Search size={17} className="text-slate-400" aria-hidden="true"/><input className="min-h-11 w-full min-w-0 outline-none" placeholder="Tên hoặc SKU…" aria-label="Tìm tên hoặc SKU" value={draft} onChange={e => setDraft(e.target.value)} /><button className="text-sm font-semibold text-indigo-700" type="submit">Tìm</button></form>
      <label className="flex items-center gap-2"><SlidersHorizontal className="text-slate-500" size={17}/><select aria-label="Lọc danh mục" className="min-h-11 w-full rounded-xl border border-slate-200 px-3" value={categoryId} onChange={e => navigate({category_id:e.target.value,page:1})}><option value="">Mọi danh mục</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <select className="min-h-11 rounded-xl border border-slate-200 px-3" aria-label="Số dòng mỗi trang" value={perPage} onChange={e => navigate({per_page:e.target.value,page:1})}>{[5,10,20].map(n => <option value={n} key={n}>{n} dòng/trang</option>)}</select>
    </div>
    <AdminTable columns={columns} data={data} loading={loading} error={error} emptyMessage="Chưa có sản phẩm phù hợp." onRetry={() => setReload(v=>v+1)} renderActions={item => <AdminRowActions editHref={`/admin/product/${item.id}/edit`} itemName={`sản phẩm ${item.name}`} onDelete={() => setConfirming(item)} />} />
    <Pagination meta={meta} onPageChange={target => navigate({page:target})}/>
    <ConfirmDialog actionLabel="Chuyển vào thùng rác" description="Bạn có chắc muốn xóa sản phẩm" onComplete={() => {setConfirming(null);setReload(v=>v+1);}} onConfirm={item => productServices.deleteProduct(item.id)} onDismiss={() => setConfirming(null)} record={confirming} title="Xóa sản phẩm này?" />
  </section>;
}
