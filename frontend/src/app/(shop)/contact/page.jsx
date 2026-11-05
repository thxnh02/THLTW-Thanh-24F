"use client";

import { useState } from 'react';
import authClient, { ensureAuthCsrfCookie } from '@/lib/axiosAuth';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try { await ensureAuthCsrfCookie(); await authClient.post('/contacts', form); setForm({ name: '', email: '', subject: '', message: '' }); setNotice('Đã gửi liên hệ. Cảm ơn bạn!'); }
    catch (err) { const fields = err.response?.data?.errors; setError(fields ? Object.values(fields).flat().join(' ') : 'Không thể gửi liên hệ. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  };
  return <section className="mx-auto max-w-2xl space-y-5 pb-10"><header><p className="eyebrow">Chúng tôi luôn sẵn sàng hỗ trợ</p><h1 className="section-title">Liên hệ</h1><p className="mt-2 text-sm text-slate-600">Để lại thông tin và câu hỏi của bạn tại đây.</p></header>
    {error && <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</p>}{notice && <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{notice}</p>}
    <form className="space-y-4 rounded-2xl border border-[#e1e9e2] bg-white p-5 sm:p-7" onSubmit={submit}>{[['name', 'Họ tên', 'text', 120], ['email', 'Email', 'email', 254], ['subject', 'Tiêu đề', 'text', 180]].map(([field, label, type, max]) => <label className="block text-sm font-medium" key={field}>{label}<input className="admin-input mt-1" type={type} required maxLength={max} value={form[field]} onChange={(e) => change(field, e.target.value)} /></label>)}<label className="block text-sm font-medium">Nội dung<textarea className="admin-input mt-1 min-h-40" required maxLength={5000} value={form.message} onChange={(e) => change('message', e.target.value)} /></label><button className="min-h-11 rounded-full bg-[#193f36] px-6 text-sm font-semibold text-white disabled:opacity-50" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi liên hệ'}</button></form>
  </section>;
}
