"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import commerceServices from '@/services/commerceServices';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [last, setLast] = useState(1);
  useEffect(() => { let active = true; commerceServices.notifications(page).then(({ data }) => { if (active) { setItems(data.data.notifications.data); setLast(data.data.notifications.last_page); } }).catch(() => { if (active) setError('Không thể tải thông báo.'); }); return () => { active = false; }; }, [page]);
  const read = async (id) => { try { await commerceServices.readNotification(id); setItems((rows) => rows.map((row) => row.id === id ? { ...row, read_at: new Date().toISOString() } : row)); } catch { setError('Không thể đánh dấu đã đọc.'); } };
  return <section className="rounded-2xl border border-[#e3ebe5] bg-white p-5 sm:p-7"><h2 className="text-xl font-semibold text-[#19352f]">Thông báo</h2>{error && <p className="mt-3 text-rose-700" role="alert">{error}</p>}<div className="mt-5 space-y-3">{items.length ? items.map((item) => <article className={`rounded-xl border p-4 ${item.read_at ? 'border-[#e3ebe5]' : 'border-[#b8d5bf] bg-[#f5faf5]'}`} key={item.id}><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-sm text-slate-600">{item.message}</p><div className="mt-3 flex gap-4 text-sm"><Link className="text-[#37665b] underline" href={item.link || '/account/orders'} onClick={() => read(item.id)}>Xem đơn hàng</Link>{!item.read_at && <button className="text-[#37665b] underline" onClick={() => read(item.id)} type="button">Đánh dấu đã đọc</button>}</div></article>) : <p className="text-sm text-slate-500">Chưa có thông báo.</p>}</div><div className="mt-5 flex gap-3"><button disabled={page <= 1} onClick={() => setPage(page - 1)} type="button">Trước</button><span>{page} / {last}</span><button disabled={page >= last} onClick={() => setPage(page + 1)} type="button">Sau</button></div></section>;
}
