"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminTable from "@/components/admin/AdminTable";
import AdminRowActions from "@/components/admin/AdminRowActions";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "@/components/admin/StatusBadge";
import Pagination from "@/components/common/Pagination";
import categoryServices from "@/services/categoryServices";

export default function AdminCategoriesPage() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(null);

  const load = useCallback((page = 1) => {
    setLoading(true);
    setError("");
    categoryServices.getAdminCategories({ page }).then((response) => {
      setData(response.data.data);
      setMeta(response.data.meta);
    }).catch((requestError) => {
      setError(requestError.response?.data?.message ?? "Không thể tải danh mục.");
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let current = true;
    categoryServices.getAdminCategories({ page: 1 }).then((response) => {
      if (!current) return;
      setData(response.data.data);
      setMeta(response.data.meta);
    }).catch((requestError) => {
      if (current) setError(requestError.response?.data?.message ?? "Không thể tải danh mục.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, []);

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Tên danh mục" },
    { key: "slug", label: "Đường dẫn" },
    { key: "parent", label: "Danh mục cha", render: (item) => item.parent?.name ?? "—" },
    { key: "status", label: "Hiển thị", render: (item) => <StatusBadge status={item.status} /> },
  ];

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Cấu trúc danh mục</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Danh mục</h1><p className="mt-2 max-w-xl text-sm text-slate-600">Sắp xếp sản phẩm theo danh mục cha và danh mục con.</p></div>
        <div className="flex flex-wrap gap-2">
          <Link className="inline-flex min-h-11 items-center rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600" href="/admin/category/trash">Mở thùng rác</Link>
          <Link className="inline-flex min-h-11 items-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href="/admin/category/create">Thêm danh mục</Link>
        </div>
      </header>
      <AdminTable columns={columns} data={data} emptyMessage="Chưa có danh mục nào." error={error} loading={loading} onRetry={() => load(meta?.current_page ?? 1)} renderActions={(item) => <AdminRowActions editHref={`/admin/category/${item.id}/edit`} itemName={`danh mục ${item.name}`} onDelete={() => setConfirming(item)} />} />
      <ConfirmDialog actionLabel="Chuyển vào thùng rác" description="Bạn có chắc muốn xóa danh mục" onComplete={() => load(meta?.current_page ?? 1)} onConfirm={(item) => categoryServices.deleteCategory(item.id)} onDismiss={() => setConfirming(null)} record={confirming} title="Xóa danh mục này?" />
      <Pagination meta={meta} onPageChange={load} />
    </section>
  );
}
