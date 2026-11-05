"use client";

import { useEffect, useState } from 'react';
import axiosClient from '@/lib/axiosClient';
import axiosAdmin from '@/lib/axiosAdmin';

const fields = [
  ['shop_name', 'Tên cửa hàng', 'text', 120], ['contact_email', 'Email liên hệ', 'email', 254],
  ['contact_phone', 'Số điện thoại', 'text', 30], ['logo_url', 'Đường dẫn logo', 'text', 500],
  ['favicon_url', 'Đường dẫn favicon', 'text', 500], ['social_url', 'Liên kết mạng xã hội (https)', 'url', 500],
  ['seo_title', 'Tiêu đề mặc định', 'text', 180], ['seo_description', 'Mô tả mặc định', 'text', 300],
  ['shipping_fee_vnd', 'Phí giao hàng cố định (đ)', 'number', 10],
];

export default function SiteSettingsPage() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    axiosClient.get('/site-settings').then(({ data }) => { if (active) setForm(data.data); }).catch(() => { if (active) setError('Không thể tải cài đặt.'); });
    return () => { active = false; };
  }, []);
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    const payload = Object.fromEntries(fields.map(([key]) => [key, key === 'shipping_fee_vnd' ? (form[key] === '' || form[key] == null ? null : Number(form[key])) : form[key] || null]));
    try { const { data } = await axiosAdmin.put('/admin/site-settings', payload); setForm(data.data); setNotice('Đã lưu cài đặt. Tải lại cửa hàng để xem thay đổi.'); }
    catch (err) { const errors = err.response?.data?.errors; setError(errors ? Object.values(errors).flat().join(' ') : 'Không thể lưu cài đặt.'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-5"><header><h1 className="text-3xl font-semibold">Cài đặt cửa hàng</h1><p className="mt-2 text-sm text-slate-600">Thông tin hiển thị, phí giao hàng và metadata mặc định của cửa hàng.</p></header>{error && <p className="rounded-lg bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</p>}{notice && <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{notice}</p>}{form && <form className="grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2" onSubmit={save}>{fields.map(([key, label, type, max]) => <label className="text-sm" key={key}>{label}<input className="admin-input mt-1" type={type} maxLength={type === 'number' ? undefined : max} min={type === 'number' ? 0 : undefined} max={type === 'number' ? 1000000000 : undefined} required={key === 'shop_name'} value={form[key] ?? ''} onChange={(e) => setForm((old) => ({ ...old, [key]: e.target.value }))} /></label>)}<button className="min-h-11 w-fit rounded-lg bg-indigo-700 px-5 text-sm font-semibold text-white" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu cài đặt'}</button></form>}</section>;
}
