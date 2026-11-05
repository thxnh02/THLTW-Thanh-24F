"use client";

import { useEffect, useState } from 'react';
import axiosAdmin from '@/lib/axiosAdmin';
import { slugify } from '@/lib/slugify.mjs';

const labels = { page: 'Trang nội dung', menu: 'Menu', banner: 'Banner' };
const blank = { type: 'page', title: '', slug: '', body: '', href: '', image: '', active: false, sort_order: 0 };

export default function SiteContentPage() {
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [manual, setManual] = useState(false);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    axiosAdmin.get('/admin/site-content', { params: { page, type: filter || undefined } }).then(({ data }) => { if (active) { setRows(data.data); setMeta(data); } })
      .catch(() => { if (active) setError('Không thể tải nội dung.'); });
    return () => { active = false; };
  }, [filter, page, reload]);
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const reset = () => { setForm(blank); setEditing(null); setManual(false); };
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    const payload = { ...form, href: form.href || null, image: form.image || null, body: form.body || null, sort_order: Number(form.sort_order) };
    try {
      if (editing) await axiosAdmin.put(`/admin/site-content/${editing}`, payload);
      else await axiosAdmin.post('/admin/site-content', payload);
      reset(); setPage(1); setReload((n) => n + 1); setNotice('Đã lưu nội dung.');
    } catch (err) { const fields = err.response?.data?.errors; setError(fields ? Object.values(fields).flat().join(' ') : 'Không thể lưu nội dung.'); }
    finally { setBusy(false); }
  };
  const remove = async (row) => {
    if (!window.confirm(`Xóa ${row.title}?`)) return;
    try { await axiosAdmin.delete(`/admin/site-content/${row.id}`); if (rows.length === 1 && page > 1) setPage(page - 1); else setReload((n) => n + 1); }
    catch { setError('Không thể xóa nội dung.'); }
  };
  return <section className="space-y-5"><header><h1 className="text-3xl font-semibold">Nội dung website</h1><p className="mt-2 text-sm text-slate-600">Quản lý trang nội dung, liên kết menu và banner trang chủ.</p></header>
    {error && <p className="rounded-lg bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</p>}{notice && <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{notice}</p>}
    <form className="grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2" onSubmit={submit}>
      <label className="text-sm">Loại<select className="admin-input mt-1" value={form.type} onChange={(e) => change('type', e.target.value)}>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="text-sm">Tiêu đề<input className="admin-input mt-1" required maxLength={180} value={form.title} onChange={(e) => setForm((old) => ({ ...old, title: e.target.value, slug: manual ? old.slug : slugify(e.target.value) }))} /></label>
      <label className="text-sm">Đường dẫn (slug)<input className="admin-input mt-1" required maxLength={200} value={form.slug} onChange={(e) => { change('slug', e.target.value); setManual(Boolean(e.target.value)); }} /></label>
      <label className="text-sm">Thứ tự<input className="admin-input mt-1" type="number" min="0" max="1000000" required value={form.sort_order} onChange={(e) => change('sort_order', e.target.value)} /></label>
      {form.type !== 'page' && <label className="text-sm">Liên kết trong website, ví dụ /products<input className="admin-input mt-1" maxLength={255} value={form.href ?? ''} onChange={(e) => change('href', e.target.value)} /></label>}
      {form.type === 'banner' && <label className="text-sm">Đường dẫn ảnh<input className="admin-input mt-1" maxLength={500} value={form.image ?? ''} onChange={(e) => change('image', e.target.value)} /></label>}
      {form.type !== 'menu' && <label className="text-sm sm:col-span-2">Nội dung<textarea className="admin-input mt-1 min-h-32" maxLength={30000} value={form.body ?? ''} onChange={(e) => change('body', e.target.value)} /></label>}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => change('active', e.target.checked)} /> Hiển thị</label><div className="flex gap-3"><button className="min-h-11 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white" disabled={busy}>{editing ? 'Lưu thay đổi' : 'Thêm nội dung'}</button>{editing && <button type="button" className="text-sm underline" onClick={reset}>Hủy sửa</button>}</div>
    </form>
    <label className="block max-w-xs text-sm">Lọc loại<select className="admin-input mt-1" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}><option value="">Tất cả</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead><tr>{['Tiêu đề', 'Loại', 'Slug', 'Hiển thị', 'Thao tác'].map((v) => <th className="p-3" key={v}>{v}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t" key={row.id}><td className="p-3">{row.title}</td><td className="p-3">{labels[row.type]}</td><td className="p-3">{row.slug}</td><td className="p-3">{row.active ? 'Có' : 'Không'}</td><td className="p-3"><button type="button" className="mr-3 text-indigo-700 underline" onClick={() => { setForm(row); setEditing(row.id); setManual(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Sửa</button><button type="button" className="text-rose-700 underline" onClick={() => remove(row)}>Xóa</button></td></tr>)}</tbody></table>{!rows.length && <p className="p-4 text-sm text-slate-500">Chưa có nội dung.</p>}</div>
    <div className="flex gap-3 text-sm"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Trang trước</button><span>Trang {page} / {meta?.last_page ?? 1}</span><button disabled={page >= (meta?.last_page ?? 1)} onClick={() => setPage(page + 1)}>Trang sau</button></div>
  </section>;
}
