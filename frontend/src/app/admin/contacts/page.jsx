"use client";

import { useEffect, useState } from 'react';
import axiosAdmin from '@/lib/axiosAdmin';

const statusLabel = { new: 'Mới', processed: 'Đã xử lý', replied: 'Đã phản hồi' };
export default function ContactsPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    axiosAdmin.get('/admin/contacts', { params: { page, status: status || undefined } }).then(({ data }) => { if (active) { setRows(data.data); setMeta(data); } })
      .catch(() => { if (active) setError('Không thể tải liên hệ.'); });
    return () => { active = false; };
  }, [page, status, reload]);
  const sendReply = async (event) => {
    event.preventDefault(); if (!selected || busy || !window.confirm(`Gửi email phản hồi đến ${selected.email}?`)) return;
    setBusy(true); setError(''); setNotice('');
    try { const { data } = await axiosAdmin.post(`/admin/contacts/${selected.id}/reply`, { reply }); setSelected(data.data); setReply(''); setReload((n) => n + 1); setNotice('Máy chủ gửi thư đã tiếp nhận phản hồi.'); }
    catch (err) { const fields = err.response?.data?.errors; setError(fields ? Object.values(fields).flat().join(' ') : 'Không thể gửi phản hồi. Kiểm tra cấu hình email.'); }
    finally { setBusy(false); }
  };
  const process = async () => {
    try { const { data } = await axiosAdmin.patch(`/admin/contacts/${selected.id}`, { status: 'processed' }); setSelected(data.data); setReload((n) => n + 1); }
    catch { setError('Không thể cập nhật liên hệ.'); }
  };
  const remove = async (row) => {
    if (!window.confirm('Xóa liên hệ này?')) return;
    try { await axiosAdmin.delete(`/admin/contacts/${row.id}`); if (selected?.id === row.id) setSelected(null); if (rows.length === 1 && page > 1) setPage(page - 1); else setReload((n) => n + 1); }
    catch { setError('Không thể xóa liên hệ.'); }
  };
  return <section className="space-y-5"><header><h1 className="text-3xl font-semibold">Liên hệ</h1><p className="mt-2 text-sm text-slate-600">Xem và phản hồi liên hệ của khách hàng.</p></header>
    {error && <p className="rounded-lg bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</p>}{notice && <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{notice}</p>}
    <label className="block max-w-xs text-sm">Trạng thái<select className="admin-input mt-1" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}><option value="">Tất cả</option><option value="new">Mới</option><option value="processed">Đã xử lý</option><option value="replied">Đã phản hồi</option></select></label>
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead><tr>{['Khách hàng', 'Tiêu đề', 'Trạng thái', 'Ngày gửi', 'Thao tác'].map((value) => <th className="p-3" key={value}>{value}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t" key={row.id}><td className="p-3">{row.name}<br /><span className="text-xs text-slate-500">{row.email}</span></td><td className="p-3">{row.subject}</td><td className="p-3">{statusLabel[row.status]}</td><td className="p-3">{new Date(row.created_at).toLocaleString('vi-VN')}</td><td className="p-3"><button className="mr-3 text-indigo-700 underline" type="button" onClick={() => { setSelected(row); setReply(''); }}>Xem</button><button className="text-rose-700 underline" type="button" onClick={() => remove(row)}>Xóa</button></td></tr>)}</tbody></table>{!rows.length && <p className="p-4 text-sm text-slate-500">Chưa có liên hệ.</p>}</div>
    <div className="flex gap-3 text-sm"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Trang trước</button><span>Trang {page} / {meta?.last_page ?? 1}</span><button disabled={page >= (meta?.last_page ?? 1)} onClick={() => setPage(page + 1)}>Trang sau</button></div>
    {selected && <div className="space-y-4 rounded-xl border bg-white p-5"><div className="flex justify-between gap-3"><h2 className="text-lg font-semibold">{selected.subject}</h2><button className="text-sm underline" onClick={() => setSelected(null)}>Đóng</button></div><p className="text-sm text-slate-600">{selected.name} · {selected.email}</p><p className="whitespace-pre-wrap text-sm">{selected.message}</p>{selected.reply && <div className="rounded-lg bg-emerald-50 p-3 text-sm"><strong>Phản hồi gần nhất</strong><p className="mt-1 whitespace-pre-wrap">{selected.reply}</p></div>}<button className="min-h-10 rounded-lg border px-3 text-sm" type="button" onClick={process}>Đánh dấu đã xử lý</button><form onSubmit={sendReply}><label className="block text-sm font-medium">Phản hồi qua email<textarea className="admin-input mt-1 min-h-32" required maxLength={5000} value={reply} onChange={(e) => setReply(e.target.value)} /></label><button className="mt-3 min-h-11 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi phản hồi'}</button></form></div>}
  </section>;
}
