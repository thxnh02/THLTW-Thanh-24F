"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "@/components/admin/StatusBadge";
import TrashTable from "@/components/admin/TrashTable";
import { runBulkTrashAction } from "@/lib/adminTrashActions.mjs";
import postServices from "@/services/postServices";

export default function PostsTrashPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(null);

  const load = useCallback((page = 1) => {
    setLoading(true);
    setError("");
    postServices.getPostTrash({ page }).then(({ data }) => {
      setRows(data.data);
      setMeta(data.meta);
    }).catch((requestError) => {
      setError(requestError.response?.data?.message ?? "Không thể tải thùng rác bài viết.");
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let current = true;
    postServices.getPostTrash({ page: 1 }).then(({ data }) => {
      if (current) { setRows(data.data); setMeta(data.meta); }
    }).catch((requestError) => {
      if (current) setError(requestError.response?.data?.message ?? "Không thể tải thùng rác bài viết.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  const selected = rows.filter((row) => selectedIds.includes(String(row.id)));
  const currentPage = meta?.current_page ?? 1;
  const reloadAfterSingle = (label) => {
    setNotice(label);
    setSelectedIds([]);
    load(rows.length <= 1 && currentPage > 1 ? currentPage - 1 : currentPage);
  };
  const applyBulkOutcome = (outcome, verb) => {
    const succeeded = new Set(outcome.succeeded.map((row) => String(row.id)));
    setRows((current) => current.filter((row) => !succeeded.has(String(row.id))));
    setSelectedIds(outcome.failed.map((row) => String(row.id)));
    setMeta((current) => current ? { ...current, total: Math.max(0, current.total - outcome.succeeded.length) } : current);
    setNotice(`${outcome.succeeded.length} bài viết ${verb}; ${outcome.failed.length} bài viết thất bại.`);
    if (outcome.succeeded.length > 0 && rows.length <= outcome.succeeded.length) load(currentPage > 1 ? currentPage - 1 : 1);
  };
  const restoreSelected = async () => {
    if (!selected.length || bulkBusy) return;
    setBulkBusy(true);
    try {
      applyBulkOutcome(await runBulkTrashAction(selected, (id) => postServices.restorePost(id)), "đã khôi phục");
    } finally {
      setBulkBusy(false);
    }
  };

  const columns = [
    { key: "title", label: "Bài viết", render: (row) => <span><span className="block font-semibold text-slate-900">{row.title}</span><span className="block text-xs text-slate-500">{row.slug}</span></span> },
    { key: "status", label: "Hiển thị trước khi xóa", render: (row) => <StatusBadge status={row.status} /> },
    { key: "deleted_at", label: "Ngày xóa", render: (row) => row.deleted_at ? new Date(row.deleted_at).toLocaleString("vi-VN") : "—" },
  ];

  return <section className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Khôi phục dữ liệu</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Thùng rác bài viết</h1><p className="mt-2 text-sm text-slate-600">Khôi phục hoặc xóa vĩnh viễn bài viết đã chuyển vào thùng rác.</p></div><Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-white" href="/admin/posts">Quay lại bài viết</Link></header>
    {notice && <p aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">{notice}</p>}
    <TrashTable
      bulkActions={<><button className="min-h-10 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50" disabled={bulkBusy} onClick={restoreSelected} type="button">Khôi phục mục đã chọn</button><button className="min-h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50" disabled={bulkBusy} onClick={() => setBulkDeleting({ items: selected, name: `${selected.length} bài viết` })} type="button">Xóa vĩnh viễn</button></>}
      columns={columns}
      data={rows}
      error={error}
      loading={loading}
      meta={meta}
      onPageChange={(page) => { setSelectedIds([]); setNotice(""); load(page); }}
      onRetry={() => load(currentPage)}
      onSelectionChange={setSelectedIds}
      renderActions={(row) => <div className="flex flex-wrap gap-2 whitespace-nowrap"><button className="min-h-10 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800" onClick={() => setRestoring(row)} type="button">Khôi phục</button><button className="min-h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700" onClick={() => setDeleting(row)} type="button">Xóa vĩnh viễn</button></div>}
      selectedIds={selectedIds}
    />
    <ConfirmDialog actionLabel="Khôi phục bài viết" description="Khôi phục bài viết" onComplete={(row) => reloadAfterSingle(`Đã khôi phục bài viết “${row.title}”.`)} onConfirm={(row) => postServices.restorePost(row.id)} onDismiss={() => setRestoring(null)} record={restoring} recordLabel={(row) => row.title} title="Khôi phục bài viết này?" variant="primary" />
    <ConfirmDialog actionLabel="Xóa vĩnh viễn" description="Thao tác này không thể hoàn tác. Xóa bài viết" onComplete={(row) => reloadAfterSingle(`Đã xóa vĩnh viễn bài viết “${row.title}”.`)} onConfirm={(row) => postServices.forceDeletePost(row.id)} onDismiss={() => setDeleting(null)} record={deleting} recordLabel={(row) => row.title} requireAcknowledgement title="Xóa vĩnh viễn bài viết?" />
    <ConfirmDialog actionLabel="Xóa vĩnh viễn mục đã chọn" acknowledgementLabel="Tôi hiểu rằng không thể khôi phục các bài viết này sau khi xóa vĩnh viễn." onComplete={(_, outcome) => applyBulkOutcome(outcome, "đã xóa vĩnh viễn")} onConfirm={(payload) => runBulkTrashAction(payload.items, (id) => postServices.forceDeletePost(id))} onDismiss={() => setBulkDeleting(null)} record={bulkDeleting} recordLabel={(payload) => `${payload.items.length} bài viết đã chọn`} renderDescription={(payload) => <ul className="list-inside list-disc text-sm leading-6 text-slate-600">{payload.items.map((row) => <li key={row.id}>{row.title}</li>)}</ul>} requireAcknowledgement title="Xóa vĩnh viễn các bài viết đã chọn?" />
  </section>;
}
