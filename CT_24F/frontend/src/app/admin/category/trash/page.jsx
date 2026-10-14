"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import TrashTable from "@/components/admin/TrashTable";
import { runBulkTrashAction } from "@/lib/adminTrashActions.mjs";
import categoryServices from "@/services/categoryServices";

export default function CategoryTrashPage() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(null);
  const [bulkConfirming, setBulkConfirming] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [notice, setNotice] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback((page = 1) => {
    setLoading(true);
    setError("");
    categoryServices.getCategoryTrash({ page }).then((response) => {
      setData(response.data.data);
      setMeta(response.data.meta);
    }).catch((requestError) => {
      setError(requestError.response?.data?.message ?? "Không thể tải thùng rác danh mục.");
    }).finally(() => setLoading(false));
  }, []);

  const selectedItems = data.filter((item) => selectedIds.includes(String(item.id)));
  const handlePageChange = (page) => {
    setSelectedIds([]);
    load(page);
  };
  const applyBulkOutcome = (outcome, action) => {
    const succeededIds = new Set(outcome.succeeded.map((item) => String(item.id)));
    setData((current) => current.filter((item) => !succeededIds.has(String(item.id))));
    setSelectedIds(outcome.failed.map((item) => String(item.id)));
    setMeta((current) => current ? { ...current, total: Math.max(0, (current.total ?? 0) - outcome.succeeded.length) } : current);
    setNotice(`${outcome.succeeded.length} mục ${action}; ${outcome.failed.length} mục thất bại. Các mục thất bại vẫn được chọn.`);
    if (data.length <= outcome.succeeded.length && (meta?.current_page ?? 1) > 1) load(meta.current_page - 1);
  };
  const restoreSelected = async () => {
    if (!selectedItems.length || bulkBusy) return;
    setBulkBusy(true);
    const outcome = await runBulkTrashAction(selectedItems, (id) => categoryServices.restoreCategory(id));
    applyBulkOutcome(outcome, "đã khôi phục");
    setBulkBusy(false);
  };
  const deleteSelected = () => {
    if (selectedItems.length) setBulkConfirming({ items: selectedItems, name: `${selectedItems.length} danh mục` });
  };

  useEffect(() => {
    let current = true;
    categoryServices.getCategoryTrash({ page: 1 }).then((response) => {
      if (!current) return;
      setData(response.data.data);
      setMeta(response.data.meta);
    }).catch((requestError) => {
      if (current) setError(requestError.response?.data?.message ?? "Không thể tải thùng rác danh mục.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, []);

  const columns = [
    { key: "name", label: "Danh mục" },
    { key: "slug", label: "Đường dẫn" },
    { key: "status", label: "Hiển thị", render: (item) => <StatusBadge status={item.status} /> },
    { key: "deleted_at", label: "Ngày xóa", render: (item) => item.deleted_at ? new Date(item.deleted_at).toLocaleString("vi-VN") : "—" },
  ];

  return <section className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Khôi phục dữ liệu</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Thùng rác danh mục</h1><p className="mt-2 text-sm text-slate-600">Khôi phục danh mục hoặc xóa vĩnh viễn khi không còn dữ liệu liên quan.</p></div><Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href="/admin/category">Quay lại danh mục</Link></header>
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
      renderActions={(item) => <div className="flex flex-wrap gap-3 whitespace-nowrap"><Link aria-label={`Khôi phục danh mục ${item.name}`} className="font-semibold text-indigo-700 hover:underline" href={`/admin/category/${item.id}/restore`}>Khôi phục</Link><button aria-label={`Xóa vĩnh viễn danh mục ${item.name}`} className="font-semibold text-rose-700 hover:underline" onClick={() => setConfirming(item)} type="button">Xóa vĩnh viễn</button></div>}
      selectedIds={selectedIds}
    />
    <ConfirmDialog actionLabel="Xóa vĩnh viễn" description="Thao tác này không thể hoàn tác. Xóa danh mục" onComplete={(item) => { setSelectedIds([]); setNotice(`Đã xóa vĩnh viễn danh mục “${item.name}”.`); load(meta?.current_page ?? 1); }} onConfirm={(item) => categoryServices.forceDeleteCategory(item.id)} onDismiss={() => setConfirming(null)} record={confirming} requireAcknowledgement title="Xóa vĩnh viễn danh mục?" />
    <ConfirmDialog actionLabel="Xóa vĩnh viễn mục đã chọn" acknowledgementLabel="Tôi hiểu rằng không thể khôi phục các danh mục này sau khi xóa vĩnh viễn." onComplete={(_, outcome) => { applyBulkOutcome(outcome, "đã xóa vĩnh viễn"); setBulkConfirming(null); }} onConfirm={(payload) => runBulkTrashAction(payload.items, (id) => categoryServices.forceDeleteCategory(id))} onDismiss={() => setBulkConfirming(null)} record={bulkConfirming} recordLabel={(payload) => `${payload.items.length} danh mục đã chọn`} renderDescription={(payload) => <ul className="list-inside list-disc text-sm leading-6 text-slate-600">{payload.items.map((item) => <li key={item.id}>{item.name}</li>)}</ul>} requireAcknowledgement title="Xóa vĩnh viễn các danh mục đã chọn?" />
  </section>;
}
