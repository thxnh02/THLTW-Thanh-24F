"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import TrashTable from "@/components/admin/TrashTable";
import productServices from "@/services/productServices";

export default function ProductTrashPage() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(null);

  const load = useCallback((page = 1) => {
    setLoading(true);
    setError("");
    productServices.getProductTrash({ page }).then((response) => {
      setData(response.data.data);
      setMeta(response.data.meta);
    }).catch((requestError) => {
      setError(requestError.response?.data?.message ?? "Could not load the product trash.");
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let current = true;
    productServices.getProductTrash({ page: 1 }).then((response) => {
      if (!current) return;
      setData(response.data.data);
      setMeta(response.data.meta);
    }).catch((requestError) => {
      if (current) setError(requestError.response?.data?.message ?? "Could not load the product trash.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, []);

  const columns = [
    { key: "name", label: "Product", render: (item) => <span><span className="block font-semibold text-slate-900">{item.name}</span><span className="block text-xs text-slate-500">{item.slug}</span></span> },
    { key: "category", label: "Category", render: (item) => item.category?.name ?? "—" },
    { key: "brand", label: "Brand", render: (item) => item.brand?.name ?? "—" },
    { key: "price", label: "Price", render: (item) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 2 }).format(Number(item.price)) },
    { key: "status", label: "Visibility before deletion", render: (item) => <StatusBadge status={item.status} /> },
    { key: "deleted_at", label: "Deleted", render: (item) => item.deleted_at ? new Date(item.deleted_at).toLocaleString() : "—" },
  ];

  return <section className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Recovery</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Product trash</h1><p className="mt-2 text-sm text-slate-600">Review deleted products, restore them, or permanently remove them.</p></div><Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href="/admin/product">Back to products</Link></header>
    <TrashTable columns={columns} data={data} error={error} loading={loading} meta={meta} onPageChange={load} onRetry={() => load(meta?.current_page ?? 1)} renderActions={(item) => <div className="flex flex-wrap gap-3 whitespace-nowrap"><Link aria-label={`Restore product ${item.name}`} className="font-semibold text-indigo-700 hover:underline" href={`/admin/product/${item.id}/restore`}>Restore</Link><button aria-label={`Permanently delete product ${item.name}`} className="font-semibold text-rose-700 hover:underline" onClick={() => setConfirming(item)} type="button">Delete permanently</button></div>} />
    <ConfirmDialog actionLabel="Xóa vĩnh viễn" description="Thao tác này không thể hoàn tác. Xóa sản phẩm" onComplete={() => load(meta?.current_page ?? 1)} onConfirm={(item) => productServices.forceDeleteProduct(item.id)} onDismiss={() => setConfirming(null)} record={confirming} title="Xóa vĩnh viễn sản phẩm?" />
  </section>;
}
