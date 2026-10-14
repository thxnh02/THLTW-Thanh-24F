"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminTable from "@/components/admin/AdminTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "@/components/admin/StatusBadge";
import Pagination from "@/components/common/Pagination";
import productServices from "@/services/productServices";

function ProductThumbnail({ product }) {
  const [failed, setFailed] = useState(false);
  if (!product.image || failed) return <span aria-label="Không có ảnh sản phẩm" className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-500" role="img">Không ảnh</span>;
  // The product schema stores a URL/path, not an upload managed by Next Image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt="" className="h-11 w-11 rounded-lg object-cover" loading="lazy" src={product.image} onError={() => setFailed(true)} />;
}

export default function AdminProductsPage() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(null);

  const load = useCallback((page = 1) => {
    setLoading(true);
    setError("");
    productServices.getAdminProducts({ page }).then((response) => {
      setData(response.data.data);
      setMeta(response.data.meta);
    }).catch((requestError) => {
      setError(requestError.response?.data?.message ?? "Không thể tải danh sách sản phẩm.");
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let current = true;
    productServices.getAdminProducts({ page: 1 }).then((response) => {
      if (!current) return;
      setData(response.data.data);
      setMeta(response.data.meta);
    }).catch((requestError) => {
      if (current) setError(requestError.response?.data?.message ?? "Không thể tải danh sách sản phẩm.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, []);

  const columns = [
    { key: "product", label: "Sản phẩm", render: (item) => <div className="flex min-w-48 items-center gap-3"><ProductThumbnail product={item} /><span className="min-w-0"><span className="block truncate font-semibold text-slate-900">{item.name}</span><span className="block truncate text-xs text-slate-500">{item.slug}</span></span></div> },
    { key: "category", label: "Danh mục", render: (item) => item.category?.name ?? "—" },
    { key: "brand", label: "Thương hiệu", render: (item) => item.brand?.name ?? "—" },
    { key: "price", label: "Giá", render: (item) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 2 }).format(Number(item.price)) },
    { key: "status", label: "Hiển thị", render: (item) => <StatusBadge status={item.status} /> },
  ];

  return <section className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Quản lý hàng hóa</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Sản phẩm</h1><p className="mt-2 text-sm text-slate-600">Xem và quản lý sản phẩm, giá bán cùng trạng thái hiển thị.</p></div><div className="flex flex-wrap gap-2"><Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href="/admin/product/trash">Thùng rác</Link><Link className="inline-flex min-h-11 items-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href="/admin/product/create">Thêm sản phẩm</Link></div></header>
    <AdminTable columns={columns} data={data} emptyMessage="Chưa có sản phẩm nào." error={error} loading={loading} onRetry={() => load(meta?.current_page ?? 1)} renderActions={(item) => <div className="flex flex-wrap gap-3 whitespace-nowrap"><Link aria-label={`Sửa sản phẩm ${item.name}`} className="font-semibold text-indigo-700 hover:underline" href={`/admin/product/${item.id}/edit`}>Sửa</Link><button aria-label={`Xóa sản phẩm ${item.name}`} className="font-semibold text-rose-700 hover:underline" onClick={() => setConfirming(item)} type="button">Xóa</button></div>} />
    <ConfirmDialog actionLabel="Chuyển vào thùng rác" description="Bạn có chắc muốn xóa sản phẩm" onComplete={() => load(meta?.current_page ?? 1)} onConfirm={(item) => productServices.deleteProduct(item.id)} onDismiss={() => setConfirming(null)} record={confirming} title="Xóa sản phẩm này?" />
    <Pagination meta={meta} onPageChange={load} />
  </section>;
}
