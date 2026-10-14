"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminTable from "@/components/admin/AdminTable";
import AdminRowActions from "@/components/admin/AdminRowActions";
import AdminCatalogThumbnail from "@/components/admin/AdminCatalogThumbnail";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "@/components/admin/StatusBadge";
import Pagination from "@/components/common/Pagination";
import brandServices from "@/services/brandServices";

// Trang /admin/brand: danh sách thương hiệu, phân trang và xác nhận chuyển vào thùng rác.
export default function AdminBrandsPage() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(null);

  // Lấy một trang thương hiệu từ API; dùng lại sau khi xóa hoặc đổi trang.
  const load = useCallback((page = 1) => {
    setLoading(true);
    setError("");
    brandServices.getAdminBrands({ page }).then((response) => {
      setData(response.data.data);
      setMeta(response.data.meta);
    }).catch((requestError) => {
      setError(requestError.response?.data?.message ?? "Không thể tải thương hiệu.");
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let current = true;
    brandServices.getAdminBrands({ page: 1 }).then((response) => {
      if (!current) return;
      setData(response.data.data);
      setMeta(response.data.meta);
    }).catch((requestError) => {
      if (current) setError(requestError.response?.data?.message ?? "Không thể tải thương hiệu.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, []);

  // Cấu hình các cột mà AdminTable sẽ hiển thị.
  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Tên thương hiệu", render: (item) => <div className="flex min-w-44 items-center gap-3"><AdminCatalogThumbnail label="thương hiệu" src={item.logo} /><span className="font-semibold text-slate-900">{item.name}</span></div> },
    { key: "slug", label: "Đường dẫn" },
    { key: "sort_order", label: "Thứ tự" },
    { key: "status", label: "Hiển thị", render: (item) => <StatusBadge status={item.status} /> },
  ];

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Quản lý thương hiệu</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Thương hiệu</h1><p className="mt-2 max-w-xl text-sm text-slate-600">Quản lý thông tin và trạng thái hiển thị của thương hiệu trên cửa hàng.</p></div>
        <div className="flex flex-wrap gap-2">
          <Link className="inline-flex min-h-11 items-center rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600" href="/admin/brand/trash">Mở thùng rác</Link>
          <Link className="inline-flex min-h-11 items-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href="/admin/brand/create">Thêm thương hiệu</Link>
        </div>
      </header>
      <AdminTable columns={columns} data={data} emptyMessage="Chưa có thương hiệu nào." error={error} loading={loading} onRetry={() => load(meta?.current_page ?? 1)} renderActions={(item) => <AdminRowActions editHref={`/admin/brand/${item.id}/edit`} itemName={`thương hiệu ${item.name}`} onDelete={() => setConfirming(item)} />} />
      <ConfirmDialog actionLabel="Chuyển vào thùng rác" description="Bạn có chắc muốn xóa thương hiệu" onComplete={() => load(meta?.current_page ?? 1)} onConfirm={(item) => brandServices.deleteBrand(item.id)} onDismiss={() => setConfirming(null)} record={confirming} title="Xóa thương hiệu này?" />
      <Pagination meta={meta} onPageChange={load} />
    </section>
  );
}
