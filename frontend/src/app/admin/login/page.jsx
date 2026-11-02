"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { safeAdminReturnTo } from '@/lib/adminAuthHelpers.mjs';
import { authErrorMessage, authFieldErrors } from '@/lib/customerAuth';
import adminAuthServices from '@/services/adminAuthServices';

const inputClass = 'mt-1.5 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true); setNotice(''); setErrors({});
    try {
      await adminAuthServices.login({ email: email.trim().toLowerCase(), password });
      const returnTo = new URLSearchParams(window.location.search).get('returnTo');
      router.replace(safeAdminReturnTo(returnTo));
    } catch (error) {
      setErrors(authFieldErrors(error));
      setNotice(authErrorMessage(error, 'Không thể đăng nhập quản trị. Vui lòng thử lại.'));
    } finally { setSubmitting(false); }
  };

  return <main className="grid min-h-dvh place-items-center bg-gradient-to-br from-slate-100 via-white to-indigo-50 px-4 py-10">
    <section aria-labelledby="admin-login-title" className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-9">
      <div className="grid size-12 place-items-center rounded-2xl bg-indigo-700 text-white"><LockKeyhole aria-hidden="true" size={24} /></div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-indigo-700">CT_24F · Quản trị</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-950" id="admin-login-title">Đăng nhập quản trị</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Chỉ tài khoản được cấp quyền admin mới truy cập được khu vực này.</p>
      <form className="mt-7 space-y-5" onSubmit={submit}>
        {notice && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{notice}</p>}
        <div><label className="text-sm font-semibold text-slate-700" htmlFor="admin-email">Email quản trị</label><input aria-describedby={errors.email ? 'admin-email-error' : undefined} aria-invalid={Boolean(errors.email)} autoComplete="username" className={inputClass} id="admin-email" maxLength={254} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.test" required type="email" value={email} />{errors.email && <p className="mt-1 text-xs text-rose-700" id="admin-email-error" role="alert">{errors.email[0]}</p>}</div>
        <div><label className="text-sm font-semibold text-slate-700" htmlFor="admin-password">Mật khẩu</label><div className="relative"><input aria-describedby={errors.password ? 'admin-password-error' : undefined} aria-invalid={Boolean(errors.password)} autoComplete="current-password" className={`${inputClass} pr-16`} id="admin-password" maxLength={128} onChange={(event) => setPassword(event.target.value)} required type={visible ? 'text' : 'password'} value={password} /><button aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute inset-y-0 right-2 my-2 grid min-w-11 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={() => setVisible((value) => !value)} type="button">{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{errors.password && <p className="mt-1 text-xs text-rose-700" id="admin-password-error" role="alert">{errors.password[0]}</p>}</div>
        <button className="min-h-12 w-full rounded-xl bg-indigo-700 px-5 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 disabled:opacity-60" disabled={submitting} type="submit">{submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
      </form>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-5 text-sm"><Link className="font-medium text-indigo-700 hover:underline" href="/forgot-password">Quên mật khẩu?</Link><Link className="text-slate-600 hover:underline" href="/">Về cửa hàng</Link></div>
    </section>
  </main>;
}
