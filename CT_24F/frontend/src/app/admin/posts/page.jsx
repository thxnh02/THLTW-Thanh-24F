"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminTable from "@/components/admin/AdminTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "@/components/admin/StatusBadge";
import Pagination from "@/components/common/Pagination";
import postServices from "@/services/postServices";

export default function PostsPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    let current = true;
    postServices.getPosts({ page }).then(({ data }) => {
      if (current) { setRows(data.data); setMeta(data.meta); setError(""); }
    }).catch((requestError) => {
      if (current) setError(requestError.response?.data?.message ?? "Không thể tải bài viết.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [page, retry]);

  const columns = [
    { key: "title", label: "Bài viết", render: (row) => <span><span className="block font-semibold text-slate-900">{row.title}</span><span className="block text-xs text-slate-500">{row.slug}</span></span> },
    { key: "status", label: "Hiển thị", render: (row) => <StatusBadge status={row.status} /> },
    { key: "updated_at", label: "Cập nhật", render: (row) => new Date(row.updated_at).toLocaleString("vi-VN") },
  ];

  return <section className="space-y-5"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Nội dung</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Bài viết</h1><p className="mt-2 text-sm text-slate-600">Xem và quản lý các bài viết đã lưu.</p></div><div className="flex flex-wrap gap-2"><Link className="inline-flex min-h-11 items-center rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700" href="/admin/posts/trash">Mở thùng rác</Link><Link className="inline-flex min-h-11 items-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-indigo-800" href="/admin/posts/create">Thêm bài viết</Link></div></header><AdminTable columns={columns} data={rows} emptyMessage="Chưa có bài viết nào." error={error} loading={loading} onRetry={() => { setLoading(true); setRetry((value) => value + 1); }} renderActions={(row) => <><Link className="rounded-lg bg-indigo-50 px-3 text-sm font-semibold text-indigo-800 hover:bg-indigo-100" href={`/admin/posts/${row.id}`}>Xem</Link><Link className="rounded-lg bg-amber-50 px-3 text-sm font-semibold text-amber-800 hover:bg-amber-100" href={`/admin/posts/${row.id}/edit`}>Sửa</Link><button className="rounded-lg bg-rose-50 px-3 text-sm font-semibold text-rose-800 hover:bg-rose-100" onClick={() => setConfirming(row)} type="button">Xóa</button></>} /><ConfirmDialog actionLabel="Chuyển vào thùng rác" description="Bạn có chắc muốn xóa bài viết" onComplete={() => { if (rows.length === 1 && page > 1) setPage(page - 1); else { setLoading(true); setRetry((value) => value + 1); } }} onConfirm={(row) => postServices.deletePost(row.id)} onDismiss={() => setConfirming(null)} record={confirming} recordLabel={(row) => row.title} title="Xóa bài viết này?" /><Pagination meta={meta} onPageChange={(next) => { setLoading(true); setPage(next); }} /></section>;
}
