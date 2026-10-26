"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import TrashTable from "@/components/admin/TrashTable";
import { runBulkTrashAction } from "@/lib/adminTrashActions.mjs";
import brandServices from "@/services/brandServices";

// Trang /admin/brand/trash: khôi phục hoặc xóa vĩnh viễn thương hiệu đã xóa mềm.
export default function BrandTrashPage() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(null);
  const [bulkConfirming, setBulkConfirming] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [notice, setNotice] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  // Lấy một trang thương hiệu trong thùng rác và thông tin phân trang.
  const load = useCallback((page = 1) => {
    setLoading(true);
    setError("");
    brandServices.getBrandTrash({ page }).then((response) => {
      setData(response.data.data);
      setMeta(response.data.meta);
    }).catch((requestError) => {
      setError(requestError.response?.data?.message ?? "Không thể tải thùng rác thương hiệu.");
    }).finally(() => setLoading(false));
  }, []);

  const selectedItems = data.filter((item) => selectedIds.includes(String(item.id)));
  const handlePageChange = (page) => {
    setSelectedIds([]);
    load(page);
  };
  // Cập nhật bảng sau thao tác hàng loạt; mục thất bại vẫn được giữ chọn.
  const applyBulkOutcome = (outcome, action) => {
    const succeededIds = new Set(outcome.succeeded.map((item) => String(item.id)));
    setData((current) => current.filter((item) => !succeededIds.has(String(item.id))));
    setSelectedIds(outcome.failed.map((item) => String(item.id)));
    setMeta((current) => current ? { ...current, total: Math.max(0, (current.total ?? 0) - outcome.succeeded.length) } : current);
    setNotice(`${outcome.succeeded.length} mục ${action}; ${outcome.failed.length} mục thất bại. Các mục thất bại vẫn được chọn.`);
    if (data.length <= outcome.succeeded.length && (meta?.current_page ?? 1) > 1) load(meta.current_page - 1);
  };
  // Khôi phục các thương hiệu đã tích chọn.
  const restoreSelected = async () => {
    if (!selectedItems.length || bulkBusy) return;
    setBulkBusy(true);
    const outcome = await runBulkTrashAction(selectedItems, (id) => brandServices.restoreBrand(id));
    applyBulkOutcome(outcome, "đã khôi phục");
    setBulkBusy(false);
  };
  // Mở hộp thoại xác nhận trước khi xóa vĩnh viễn các mục đã chọn.
  const deleteSelected = () => {
    if (selectedItems.length) setBulkConfirming({ items: selectedItems, name: `${selectedItems.length} thương hiệu` });
  };

  useEffect(() => {
    let current = true;
    brandServices.getBrandTrash({ page: 1 }).then((response) => {
      if (!current) return;
      setData(response.data.data);
      setMeta(response.data.meta);
    }).catch((requestError) => {
      if (current) setError(requestError.response?.data?.message ?? "Không thể tải thùng rác thương hiệu.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, []);

  const columns = [
    { key: "name", label: "Thương hiệu" },
    { key: "slug", label: "Đường dẫn" },
    { key: "status", label: "Hiển thị", render: (item) => <StatusBadge status={item.status} /> },
    { key: "deleted_at", label: "Ngày xóa", render: (item) => item.deleted_at ? new Date(item.deleted_at).toLocaleString("vi-VN") : "—" },
  ];

  return <section className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Khôi phục dữ liệu</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Thùng rác thương hiệu</h1><p className="mt-2 text-sm text-slate-600">Khôi phục thương hiệu hoặc xóa vĩnh viễn khi không còn dữ liệu liên quan.</p></div><Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href="/admin/brand">Quay lại thương hiệu</Link></header>
    {notice && <p aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">{notice}</p>}
    <TrashTable
      bulkActions={<><button className="min-h-10 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50" disabled={bulkBusy} onClick={restoreSelected} type="button">Khôi phục mục đã chọn</button><button className="min-h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700" onClick={deleteSelected} type="button">Xóa vĩnh viễn</button></>}
      columns={columns}
      data={data}
      error={error}
      loading={loading}
      meta={meta}
      onPageChange={handlePageChange}
      onRetry={() => load(meta?.current_page ?? 1)}
      onSelectionChange={setSelectedIds}
      renderActions={(item) => <div className="flex flex-wrap gap-3 whitespace-nowrap"><Link aria-label={`Khôi phục thương hiệu ${item.name}`} className="font-semibold text-indigo-700 hover:underline" href={`/admin/brand/${item.id}/restore`}>Khôi phục</Link><button aria-label={`Xóa vĩnh viễn thương hiệu ${item.name}`} className="font-semibold text-rose-700 hover:underline" onClick={() => setConfirming(item)} type="button">Xóa vĩnh viễn</button></div>}
      selectedIds={selectedIds}
    />
    <ConfirmDialog actionLabel="Xóa vĩnh viễn" description="Thao tác này không thể hoàn tác. Xóa thương hiệu" onComplete={(item) => { setSelectedIds([]); setNotice(`Đã xóa vĩnh viễn thương hiệu “${item.name}”.`); load(meta?.current_page ?? 1); }} onConfirm={(item) => brandServices.forceDeleteBrand(item.id)} onDismiss={() => setConfirming(null)} record={confirming} requireAcknowledgement title="Xóa vĩnh viễn thương hiệu?" />
    <ConfirmDialog actionLabel="Xóa vĩnh viễn mục đã chọn" acknowledgementLabel="Tôi hiểu rằng không thể khôi phục các thương hiệu này sau khi xóa vĩnh viễn." onComplete={(_, outcome) => { applyBulkOutcome(outcome, "đã xóa vĩnh viễn"); setBulkConfirming(null); }} onConfirm={(payload) => runBulkTrashAction(payload.items, (id) => brandServices.forceDeleteBrand(id))} onDismiss={() => setBulkConfirming(null)} record={bulkConfirming} recordLabel={(payload) => `${payload.items.length} thương hiệu đã chọn`} renderDescription={(payload) => <ul className="list-inside list-disc text-sm leading-6 text-slate-600">{payload.items.map((item) => <li key={item.id}>{item.name}</li>)}</ul>} requireAcknowledgement title="Xóa vĩnh viễn các thương hiệu đã chọn?" />
  </section>;
}
