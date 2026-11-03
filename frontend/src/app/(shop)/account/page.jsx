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
  const [notice, setNotice] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const dirtyRef = useRef(false);
  const [preview, setPreview] = useState('');

  const loadProfile = () => customerAccountServices.profile().then((response) => {
    setDefaultAddress(response.data?.data?.default_address ?? null);
    if (!dirtyRef.current) setForm({ name: response.data?.data?.user?.name ?? user.name, phone: response.data?.data?.user?.phone ?? '' });
    setProfileError('');
  }).catch((error) => { setProfileError(authErrorMessage(error, 'Không thể tải thông tin hồ sơ. Vui lòng thử lại.')); if (error.response?.status === 401) refreshUser().catch(() => {}); });

  useEffect(() => {
    let active = true;
    customerAccountServices.profile().then((response) => {
      if (!active) return;
      setDefaultAddress(response.data?.data?.default_address ?? null);
      if (!dirtyRef.current) setForm({ name: response.data?.data?.user?.name ?? '', phone: response.data?.data?.user?.phone ?? '' });
    }).catch((error) => { if (active) { setProfileError(authErrorMessage(error, 'Không thể tải thông tin hồ sơ. Vui lòng thử lại.')); if (error.response?.status === 401) refreshUser().catch(() => {}); } });
    return () => { active = false; };
  }, [refreshUser]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setNotice(null); setErrors({});
    try {
      const response = await customerAccountServices.updateProfile({ name: form.name, phone: form.phone || null });
      if (!response.data?.data?.user) throw new Error('Máy chủ chưa xác nhận cập nhật hồ sơ.');
      dirtyRef.current = false;
      setNotice({ message: 'Hồ sơ đã được cập nhật.', tone: 'success' });
      try { await refreshUser(); }
      catch { setNotice({ message: 'Hồ sơ đã được lưu. Chưa thể làm mới thông tin hiển thị; hãy tải lại trang sau.', tone: 'success' }); }
    } catch (error) { setErrors(authFieldErrors(error)); setNotice({ message: authErrorMessage(error), tone: 'error' }); if (error.response?.status === 401) refreshUser().catch(() => {}); }
    finally { setSaving(false); }
  };

  const upload = async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setNotice({ message: 'Chọn ảnh JPEG, PNG hoặc WebP nhỏ hơn 2 MB.', tone: 'error' }); return;
    }
    setUploading(true); setNotice(null);
    setPreview(URL.createObjectURL(file));
    try {
      await customerAccountServices.uploadAvatar(file);
      await refreshUser();
      setNotice({ message: 'Ảnh đại diện đã được cập nhật.', tone: 'success' });
    } catch (error) { setNotice({ message: authErrorMessage(error, 'Không thể tải ảnh lên. Vui lòng thử lại.'), tone: 'error' }); if (error.response?.status === 401) refreshUser().catch(() => {}); }
    finally { setUploading(false); setPreview(''); if (fileRef.current) fileRef.current.value = ''; }
  };

  const removeAvatar = async () => {
    if (!window.confirm('Xóa ảnh đại diện hiện tại?')) return;
    setUploading(true); setNotice(null);
    try { await customerAccountServices.deleteAvatar(); await refreshUser(); setNotice({ message: 'Đã xóa ảnh đại diện.', tone: 'success' }); }
    catch (error) { setNotice({ message: authErrorMessage(error), tone: 'error' }); if (error.response?.status === 401) refreshUser().catch(() => {}); }
    finally { setUploading(false); }
  };

  return <>
    <section className="rounded-2xl border border-[#e3ebe5] bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold text-[#19352f]">Hồ sơ của tôi</h2><p className="mt-1 text-sm text-slate-500">Cập nhật thông tin hiển thị và liên hệ của bạn.</p></div><span className="inline-flex items-center gap-1 rounded-full bg-[#e8f2e9] px-3 py-1 text-xs font-semibold text-[#28584a]"><ShieldCheck className="size-3.5" /> {user.email_verified_at ? 'Email đã xác minh' : 'Email chưa xác minh'}</span></div>
      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl bg-[#f7faf7] p-4">
        {preview ? <span aria-label="Xem trước ảnh đại diện" className="size-16 rounded-full bg-cover bg-center" role="img" style={{ backgroundImage: `url("${preview}")` }} /> : <CustomerAvatar size="size-16 text-xl" user={user} />}
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#19352f]">Ảnh đại diện</p><p className="mt-0.5 text-xs text-slate-500">JPEG, PNG hoặc WebP · Tối đa 2 MB</p><div className="mt-2 flex flex-wrap gap-2"><input accept="image/jpeg,image/png,image/webp" aria-label="Chọn tệp ảnh đại diện" className="sr-only" disabled={uploading} onChange={(event) => upload(event.target.files?.[0])} ref={fileRef} type="file" /><button aria-busy={uploading} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#cddfd0] bg-white px-3 text-xs font-semibold text-[#28584a] hover:bg-[#eff5ef] focus-visible:outline-2 focus-visible:outline-[#37665b] disabled:opacity-50" disabled={uploading} onClick={() => fileRef.current?.click()} type="button"><Camera className="size-4" />{uploading ? 'Đang xử lý…' : 'Chọn ảnh'}</button>{user.avatar_url && <button className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 text-xs font-medium text-rose-700 hover:bg-rose-50" disabled={uploading} onClick={removeAvatar} type="button"><Trash2 className="size-4" />Xóa ảnh</button>}</div></div>
      </div>
      {notice && <div className="mt-4"><AuthNotice tone={notice.tone}>{notice.message}</AuthNotice></div>}
      <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={save}>
        <AuthField error={errors.name?.[0]} id="account-name" label="Họ và tên"><input autoComplete="name" className={authInputClass} id="account-name" maxLength={150} onChange={(event) => { dirtyRef.current = true; setForm({ ...form, name: event.target.value }); }} required value={form.name} /></AuthField>
        <AuthField error={errors.phone?.[0]} id="account-phone" label="Số điện thoại liên hệ"><input autoComplete="tel" className={authInputClass} id="account-phone" inputMode="tel" onChange={(event) => { dirtyRef.current = true; setForm({ ...form, phone: event.target.value }); }} placeholder="0912345678" value={form.phone} /></AuthField>
        <div className="sm:col-span-2"><label className="block text-sm font-medium text-[#29483f]" htmlFor="account-email">Email đăng nhập</label><input className={`${authInputClass} bg-[#f5f7f5] text-slate-500`} id="account-email" readOnly value={user.email} /><p className="mt-1 text-xs text-slate-500">Để đổi email, cần một quy trình xác minh riêng.</p></div>
        <div className="sm:col-span-2"><button className={`${authButtonClass} min-w-36`} disabled={saving} type="submit">{saving ? 'Đang lưu…' : 'Lưu hồ sơ'}</button></div>
      </form>
    </section>
    <section className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-[#e3ebe5] bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-[#28584a]"><MapPin className="size-4" /><h2 className="font-semibold">Địa chỉ mặc định</h2></div>{profileError ? <><p className="mt-3 text-sm text-rose-700" role="alert">{profileError}</p><button className="mt-2 text-sm font-semibold text-[#37665b] underline" onClick={loadProfile} type="button">Thử lại</button></> : <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{defaultAddress ? `${defaultAddress.recipient_name} · ${defaultAddress.full_address}` : 'Bạn chưa lưu địa chỉ nhận hàng.'}</p>}<Link className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-[#37665b] hover:underline" href="/account/addresses">Quản lý địa chỉ →</Link></div><div className="rounded-2xl border border-[#e3ebe5] bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-[#28584a]"><ShieldCheck className="size-4" /><h2 className="font-semibold">Bảo mật tài khoản</h2></div><p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">Đổi mật khẩu định kỳ và giữ thông tin đăng nhập an toàn.</p><Link className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-[#37665b] hover:underline" href="/account/security">Đến trang bảo mật →</Link></div></section>
  </>;
}
