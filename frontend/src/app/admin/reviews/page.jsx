"use client";

import { useEffect, useState } from 'react';
import axiosAdmin from '@/lib/axiosAdmin';

export default function ReviewsPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [visibility, setVisibility] = useState('');
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    axiosAdmin.get('/admin/reviews', { params: { page, visibility: visibility || undefined, q: query || undefined } })
      .then(({ data }) => { if (active) { setRows(data.data); setMeta(data); setError(''); } })
      .catch(() => { if (active) setError('Không thể tải danh sách đánh giá.'); });
    return () => { active = false; };
  }, [page, visibility, query, reload]);
  const toggle = async (row) => {
    if (!window.confirm(`${row.is_visible ? 'Ẩn' : 'Hiện'} đánh giá này?`)) return;
    setBusy(row.id); setError('');
    try { await axiosAdmin.patch(`/admin/reviews/${row.id}`, { is_visible: !row.is_visible }); setReload((n) => n + 1); }
    catch { setError('Không thể cập nhật đánh giá.'); }
    finally { setBusy(null); }
  };
  return <section className="space-y-5"><header><h1 className="text-3xl font-semibold">Đánh giá sản phẩm</h1><p className="mt-2 text-sm text-slate-600">Xem và ẩn hoặc hiện đánh giá của khách đã nhận hàng.</p></header>
    {error && <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</p>}
    <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(draft.trim()); }}><label className="text-sm">Tên sản phẩm hoặc khách<input className="admin-input mt-1 block" maxLength={100} value={draft} onChange={(e) => setDraft(e.target.value)} /></label><label className="text-sm">Trạng thái<select className="admin-input mt-1 block" value={visibility} onChange={(e) => { setPage(1); setVisibility(e.target.value); }}><option value="">Tất cả</option><option value="visible">Đang hiện</option><option value="hidden">Đang ẩn</option></select></label><button className="min-h-11 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white">Tìm kiếm</button></form>
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr>{['Sản phẩm', 'Khách hàng', 'Đánh giá', 'Trạng thái', 'Thao tác'].map((label) => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t" key={row.id}><td className="p-3">{row.product?.name ?? 'Sản phẩm không còn'}</td><td className="p-3">{row.user?.name ?? 'Khách hàng'}</td><td className="max-w-sm p-3"><strong>{row.rating}/5 {row.title && `· ${row.title}`}</strong><p className="mt-1 whitespace-pre-wrap break-words">{row.body}</p></td><td className="p-3">{row.is_visible ? 'Đang hiện' : 'Đang ẩn'}</td><td className="p-3"><button className="min-h-10 rounded-lg border px-3 font-semibold text-indigo-700 disabled:opacity-50" disabled={busy !== null} onClick={() => toggle(row)} type="button">{row.is_visible ? 'Ẩn' : 'Hiện'}</button></td></tr>)}</tbody></table>{!rows.length && <p className="p-4 text-sm text-slate-500">Chưa có đánh giá phù hợp.</p>}</div>
    <div className="flex gap-3 text-sm"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Trang trước</button><span>Trang {page} / {meta?.last_page ?? 1}</span><button disabled={page >= (meta?.last_page ?? 1)} onClick={() => setPage(page + 1)}>Trang sau</button></div>
  </section>;
}
