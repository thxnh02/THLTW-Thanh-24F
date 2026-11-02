"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Camera, MapPin, ShieldCheck, Trash2 } from 'lucide-react';
import { AuthField, AuthNotice, authButtonClass, authInputClass, authErrorMessage, authFieldErrors } from '@/components/shop/AuthFormShell';
import CustomerAvatar from '@/components/shop/CustomerAvatar';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import customerAccountServices from '@/services/customerAccountServices';

export default function CustomerAccountPage() {
  const { user, refreshUser } = useCustomerAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone ?? '' });
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [notice, setNotice] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const [preview, setPreview] = useState('');

  const loadProfile = () => customerAccountServices.profile().then((response) => {
    setDefaultAddress(response.data?.data?.default_address ?? null);
    setForm({ name: response.data?.data?.user?.name ?? user.name, phone: response.data?.data?.user?.phone ?? '' });
    setProfileError('');
  }).catch(() => setProfileError('Không thể tải thông tin hồ sơ. Vui lòng thử lại.'));

  useEffect(() => {
    let active = true;
    customerAccountServices.profile().then((response) => {
      if (!active) return;
      setDefaultAddress(response.data?.data?.default_address ?? null);
      setForm({ name: response.data?.data?.user?.name ?? user.name, phone: response.data?.data?.user?.phone ?? '' });
    }).catch(() => { if (active) setProfileError('Không thể tải thông tin hồ sơ. Vui lòng thử lại.'); });
    return () => { active = false; };
  }, [user.name]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setNotice(''); setErrors({});
    try {
      await customerAccountServices.updateProfile({ name: form.name, phone: form.phone || null });
      await refreshUser();
      setNotice('Hồ sơ đã được cập nhật.');
    } catch (error) { setErrors(authFieldErrors(error)); setNotice(authErrorMessage(error)); }
    finally { setSaving(false); }
  };

  const upload = async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setNotice('Chọn ảnh JPEG, PNG hoặc WebP nhỏ hơn 2 MB.'); return;
    }
    setUploading(true); setNotice('');
    setPreview(URL.createObjectURL(file));
    try {
      await customerAccountServices.uploadAvatar(file);
      await refreshUser();
      setNotice('Ảnh đại diện đã được cập nhật.');
    } catch (error) { setNotice(authErrorMessage(error, 'Không thể tải ảnh lên. Vui lòng thử lại.')); }
    finally { setUploading(false); setPreview(''); if (fileRef.current) fileRef.current.value = ''; }
  };

  const removeAvatar = async () => {
    setUploading(true); setNotice('');
    try { await customerAccountServices.deleteAvatar(); await refreshUser(); setNotice('Đã xóa ảnh đại diện.'); }
    catch (error) { setNotice(authErrorMessage(error)); }
    finally { setUploading(false); }
  };

  return <>
    <section className="rounded-2xl border border-[#e3ebe5] bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold text-[#19352f]">Hồ sơ của tôi</h2><p className="mt-1 text-sm text-slate-500">Cập nhật thông tin hiển thị và liên hệ của bạn.</p></div><span className="inline-flex items-center gap-1 rounded-full bg-[#e8f2e9] px-3 py-1 text-xs font-semibold text-[#28584a]"><ShieldCheck className="size-3.5" /> Email đã xác minh</span></div>
      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl bg-[#f7faf7] p-4">
        {preview ? <span aria-label="Xem trước ảnh đại diện" className="size-16 rounded-full bg-cover bg-center" role="img" style={{ backgroundImage: `url("${preview}")` }} /> : <CustomerAvatar size="size-16 text-xl" user={user} />}
        <div className="flex-1"><p className="text-sm font-semibold text-[#19352f]">Ảnh đại diện</p><p className="mt-0.5 text-xs text-slate-500">JPEG, PNG hoặc WebP · Tối đa 2 MB</p><div className="mt-2 flex flex-wrap gap-2"><label className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-[#cddfd0] bg-white px-3 text-xs font-semibold text-[#28584a] hover:bg-[#eff5ef]"><Camera className="size-4" />{uploading ? 'Đang xử lý…' : 'Chọn ảnh'}<input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={(event) => upload(event.target.files?.[0])} ref={fileRef} type="file" /></label>{user.avatar_url && <button className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 text-xs font-medium text-rose-700 hover:bg-rose-50" disabled={uploading} onClick={removeAvatar} type="button"><Trash2 className="size-4" />Xóa ảnh</button>}</div></div>
      </div>
      {notice && <div className="mt-4"><AuthNotice tone={notice.includes('đã được cập nhật') || notice.includes('Đã xóa') ? 'success' : 'error'}>{notice}</AuthNotice></div>}
      <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={save}>
        <AuthField error={errors.name?.[0]} id="account-name" label="Họ và tên"><input autoComplete="name" className={authInputClass} id="account-name" maxLength={150} onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} /></AuthField>
        <AuthField error={errors.phone?.[0]} id="account-phone" label="Số điện thoại liên hệ"><input autoComplete="tel" className={authInputClass} id="account-phone" inputMode="tel" onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="0912345678" value={form.phone} /></AuthField>
        <div className="sm:col-span-2"><label className="block text-sm font-medium text-[#29483f]" htmlFor="account-email">Email đã xác minh</label><input className={`${authInputClass} bg-[#f5f7f5] text-slate-500`} id="account-email" readOnly value={user.email} /><p className="mt-1 text-xs text-slate-500">Để đổi email, cần một quy trình xác minh riêng.</p></div>
        <div className="sm:col-span-2"><button className={`${authButtonClass} min-w-36`} disabled={saving} type="submit">{saving ? 'Đang lưu…' : 'Lưu hồ sơ'}</button></div>
      </form>
    </section>
    <section className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-[#e3ebe5] bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-[#28584a]"><MapPin className="size-4" /><h2 className="font-semibold">Địa chỉ mặc định</h2></div>{profileError ? <><p className="mt-3 text-sm text-rose-700" role="alert">{profileError}</p><button className="mt-2 text-sm font-semibold text-[#37665b] underline" onClick={loadProfile} type="button">Thử lại</button></> : <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{defaultAddress ? `${defaultAddress.recipient_name} · ${defaultAddress.full_address}` : 'Bạn chưa lưu địa chỉ nhận hàng.'}</p>}<Link className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-[#37665b] hover:underline" href="/account/addresses">Quản lý địa chỉ →</Link></div><div className="rounded-2xl border border-[#e3ebe5] bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-[#28584a]"><ShieldCheck className="size-4" /><h2 className="font-semibold">Bảo mật tài khoản</h2></div><p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">Đổi mật khẩu định kỳ và giữ thông tin đăng nhập an toàn.</p><Link className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-[#37665b] hover:underline" href="/account/security">Đến trang bảo mật →</Link></div></section>
  </>;
}
