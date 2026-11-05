"use client";

import { useEffect, useState } from "react";
import axiosAdmin from "@/lib/axiosAdmin";
import { slugify } from "@/lib/slugify.mjs";

export default function PostTopicsPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [manual, setManual] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let current = true;
    axiosAdmin.get('/admin/post-topics', { params: { page } }).then(({ data }) => { if (current) { setItems(data.data); setMeta(data); } })
      .catch(() => { if (current) setError('Không thể tải chủ đề.'); });
    return () => { current = false; };
  }, [page, reload]);
  const reset = () => { setEditing(null); setName(''); setSlug(''); setManual(false); };
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (editing) await axiosAdmin.put(`/admin/post-topics/${editing}`, { name, slug });
      else await axiosAdmin.post('/admin/post-topics', { name, slug });
      reset(); setPage(1); setReload((n) => n + 1);
    } catch (err) { const fields = err.response?.data?.errors; setError(fields ? Object.values(fields).flat().join(' ') : 'Không thể lưu chủ đề.'); }
    finally { setBusy(false); }
  };
  const remove = async (topic) => {
    if (!window.confirm(`Xóa chủ đề ${topic.name}?`)) return;
    try { await axiosAdmin.delete(`/admin/post-topics/${topic.id}`); if (items.length === 1 && page > 1) setPage(page - 1); else setReload((n) => n + 1); }
    catch (err) { const fields = err.response?.data?.errors; setError(fields ? Object.values(fields).flat().join(' ') : 'Không thể xóa chủ đề.'); }
  };
  return <section className="space-y-5"><header><h1 className="text-3xl font-semibold">Chủ đề bài viết</h1><p className="mt-2 text-sm text-slate-600">Phân loại bài viết để khách hàng dễ tìm.</p></header>
    {error && <p className="rounded-lg bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</p>}
    <form className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-5" onSubmit={submit}>
      <label className="text-sm font-medium">Tên chủ đề<input className="admin-input mt-1 block" maxLength={120} required value={name} onChange={(e) => { setName(e.target.value); if (!manual) setSlug(slugify(e.target.value)); }} /></label>
      <label className="text-sm font-medium">Đường dẫn<input className="admin-input mt-1 block" maxLength={150} required value={slug} onChange={(e) => { setSlug(e.target.value); setManual(Boolean(e.target.value)); }} /></label>
      <button className="min-h-11 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white" disabled={busy}>{editing ? 'Lưu' : 'Thêm chủ đề'}</button>{editing && <button className="min-h-11 px-3 text-sm underline" type="button" onClick={reset}>Hủy sửa</button>}
    </form>
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Tên</th><th className="p-3">Đường dẫn</th><th className="p-3">Bài viết</th><th className="p-3">Thao tác</th></tr></thead><tbody>{items.map((topic) => <tr className="border-t" key={topic.id}><td className="p-3">{topic.name}</td><td className="p-3">{topic.slug}</td><td className="p-3">{topic.posts_count}</td><td className="p-3"><button type="button" className="mr-4 text-indigo-700 underline" onClick={() => { setEditing(topic.id); setName(topic.name); setSlug(topic.slug); setManual(true); }}>Sửa</button><button type="button" className="text-rose-700 underline" onClick={() => remove(topic)}>Xóa</button></td></tr>)}</tbody></table>{!items.length && <p className="p-4 text-sm text-slate-500">Chưa có chủ đề.</p>}</div>
    <div className="flex gap-3 text-sm"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Trang trước</button><span>Trang {page} / {meta?.last_page ?? 1}</span><button disabled={page >= (meta?.last_page ?? 1)} onClick={() => setPage(page + 1)}>Trang sau</button></div>
  </section>;
}
