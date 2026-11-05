"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import axiosAdmin from '@/lib/axiosAdmin';

export default function DashboardStats() {
  const [range, setRange] = useState({ from: '', to: '' });
  const [applied, setApplied] = useState({});
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    axiosAdmin.get('/admin/dashboard', { params: applied }).then(({ data }) => { if (active) { setStats(data.data); setError(''); } })
      .catch((err) => { if (active) { setStats(null); setError(err.response?.data?.message ?? 'Không thể tải thống kê.'); } });
    return () => { active = false; };
  }, [applied]);
  return <section className="space-y-4"><div><h2 className="text-xl font-semibold">Tổng quan đơn hàng</h2><p className="mt-1 text-sm text-slate-500">{stats ? `Đơn tạo từ ${stats.from} đến ${stats.to}` : 'Mặc định: 30 ngày gần nhất.'} Tổng tiền tính theo đơn đã giao, bao gồm phí giao hàng.</p></div><form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); setApplied({ ...(range.from ? { from: range.from } : {}), ...(range.to ? { to: range.to } : {}) }); }}><label className="text-sm">Từ ngày<input className="admin-input mt-1 block" type="date" value={range.from} onChange={(event) => setRange((old) => ({ ...old, from: event.target.value }))} /></label><label className="text-sm">Đến ngày<input className="admin-input mt-1 block" type="date" value={range.to} onChange={(event) => setRange((old) => ({ ...old, to: event.target.value }))} /></label><button className="min-h-11 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white">Xem thống kê</button></form>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}{stats && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[['Đơn trong kỳ', stats.orders_count, '/admin/orders'], ['Đơn đã giao trong kỳ', stats.delivered_count, '/admin/orders'], ['Tổng tiền đơn đã giao', `${Number(stats.delivered_total_vnd).toLocaleString('vi-VN')} đ`, '/admin/orders'], ['Đơn chờ xử lý hiện tại', stats.pending_orders, '/admin/orders'], ['Sản phẩm còn tối đa 5', stats.low_stock, '/admin/inventory'], ['Liên hệ mới', stats.new_contacts, '/admin/contacts']].map(([label, value, href]) => <Link href={href} key={label} className="rounded-xl border bg-white p-4 hover:border-indigo-300"><span className="block text-sm text-slate-600">{label}</span><strong className="mt-2 block text-2xl text-slate-950">{value}</strong></Link>)}</div>}</section>;
}
