"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthField, AuthNotice, PasswordInput, authButtonClass, authErrorMessage, authFieldErrors } from '@/components/shop/AuthFormShell';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import customerAccountServices from '@/services/customerAccountServices';

const initialForm = { current_password: '', password: '', password_confirmation: '' };

export default function CustomerSecurityPage() {
  const router = useRouter();
  const { user, refreshUser } = useCustomerAuth();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setNotice(''); setErrors({});
    try {
      await customerAccountServices.changePassword(form);
      setForm(initialForm);
      await refreshUser().catch(() => null);
      router.replace('/login?returnTo=%2Faccount%2Fsecurity');
    } catch (error) { setErrors(authFieldErrors(error)); setNotice(authErrorMessage(error, 'Không thể đổi mật khẩu. Vui lòng thử lại.')); }
    finally { setSaving(false); }
  };

  return <>
    <section className="rounded-2xl border border-[#e3ebe5] bg-white p-5 shadow-sm sm:p-7"><h2 className="text-xl font-semibold text-[#19352f]">Bảo mật tài khoản</h2><p className="mt-1 text-sm text-slate-500">Email dùng để đăng nhập và khôi phục mật khẩu.</p><div className="mt-5 rounded-xl bg-[#f7faf7] p-4"><p className="break-all text-sm font-medium text-[#19352f]">{user.email}</p><p className={`mt-1 text-xs font-semibold ${user.email_verified_at ? 'text-[#37665b]' : 'text-amber-700'}`}>{user.email_verified_at ? 'Email đã xác minh' : 'Email chưa xác minh'}</p>{!user.email_verified_at && <Link className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-[#37665b] underline" href="/verify-email">Xác minh email</Link>}</div></section>
    <section className="rounded-2xl border border-[#e3ebe5] bg-white p-5 shadow-sm sm:p-7"><h2 className="text-lg font-semibold text-[#19352f]">Đổi mật khẩu</h2><p className="mt-1 text-sm text-slate-500">Sau khi đổi, các phiên đăng nhập cũ sẽ hết hiệu lực.</p><form className="mt-5 max-w-md space-y-4" onSubmit={submit}>{notice && <AuthNotice>{notice}</AuthNotice>}{[['current_password', 'Mật khẩu hiện tại', 'current-password'], ['password', 'Mật khẩu mới', 'new-password'], ['password_confirmation', 'Nhập lại mật khẩu mới', 'new-password']].map(([key, label, autoComplete]) => <AuthField error={errors[key]?.[0]} id={`security-${key}`} key={key} label={label}><PasswordInput autoComplete={autoComplete} error={errors[key]?.[0]} id={`security-${key}`} onChange={(event) => setForm({ ...form, [key]: event.target.value })} value={form[key]} /></AuthField>)}<p className="text-xs text-slate-500">Mật khẩu mới cần ít nhất 8 ký tự.</p><button className={`${authButtonClass} w-full sm:w-auto`} disabled={saving} type="submit">{saving ? 'Đang đổi mật khẩu…' : 'Đổi mật khẩu'}</button></form></section>
  </>;
}
