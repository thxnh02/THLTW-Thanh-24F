"use client";

import { useCallback, useEffect, useState } from 'react';
import { Dialog } from 'radix-ui';
import { Check, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import { AuthNotice, authButtonClass, authErrorMessage, authFieldErrors, authInputClass } from '@/components/shop/AuthFormShell';
import { emptyAddressDraft, toAddressPayload, validateAddressDraft } from '@/lib/accountAddressForm.mjs';
import customerAccountServices from '@/services/customerAccountServices';

const fields = [
  ['recipient_name', 'Tên người nhận', 'text', 'name', true],
  ['recipient_phone', 'Số điện thoại', 'tel', 'tel', true],
  ['province', 'Tỉnh / Thành phố', 'text', 'address-level1', true],
  ['ward', 'Phường / Xã', 'text', 'address-level3', true],
  ['street', 'Số nhà, tên đường', 'text', 'street-address', true],
  ['district', 'Quận / Huyện (nếu có)', 'text', 'address-level2', false],
  ['detail', 'Căn hộ, tầng hoặc chỉ dẫn', 'text', 'off', false],
  ['delivery_note', 'Ghi chú giao hàng', 'text', 'off', false],
];

export default function CustomerAddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(emptyAddressDraft);
  const [fieldErrors, setFieldErrors] = useState({});
  const [dialogError, setDialogError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    try {
      const response = await customerAccountServices.addresses();
      setAddresses(response.data?.data?.addresses ?? []);
      setError('');
    } catch { setError('Không thể tải sổ địa chỉ. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    customerAccountServices.addresses().then((response) => {
      if (active) { setAddresses(response.data?.data?.addresses ?? []); setError(''); }
    }).catch(() => { if (active) setError('Không thể tải sổ địa chỉ. Vui lòng thử lại.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const openForm = (address = null) => {
    setEditing(address);
    setDraft(address ? { ...emptyAddressDraft, ...address } : emptyAddressDraft);
    setFieldErrors({}); setDialogError(''); setNotice(''); setDialogOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    const errors = validateAddressDraft(draft);
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setSaving(true); setFieldErrors({}); setDialogError('');
    try {
      const payload = toAddressPayload(draft);
      if (editing) await customerAccountServices.updateAddress(editing.id, payload);
      else await customerAccountServices.createAddress(payload);
      setDialogOpen(false);
      setNotice(editing ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ.');
      await load();
    } catch (requestError) {
      setFieldErrors(authFieldErrors(requestError));
      setDialogError(authErrorMessage(requestError, 'Không thể lưu địa chỉ. Vui lòng thử lại.'));
    } finally { setSaving(false); }
  };

  const makeDefault = async (id) => {
    setActingId(id); setError('');
    try { await customerAccountServices.setDefaultAddress(id); await load(); setNotice('Đã đổi địa chỉ mặc định.'); }
    catch (requestError) { setError(authErrorMessage(requestError)); }
    finally { setActingId(null); }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setActingId(deleteTarget.id); setError('');
    try { await customerAccountServices.deleteAddress(deleteTarget.id); setDeleteTarget(null); await load(); setNotice('Đã xóa địa chỉ.'); }
    catch (requestError) { setError(authErrorMessage(requestError)); }
    finally { setActingId(null); }
  };

  return <section className="rounded-2xl border border-[#e3ebe5] bg-white p-5 shadow-sm sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold text-[#19352f]">Địa chỉ của tôi</h2><p className="mt-1 text-sm text-slate-500">Lưu tối đa 10 địa chỉ. Địa chỉ đầu tiên được chọn mặc định.</p></div><button className={`${authButtonClass} gap-2`} disabled={addresses.length >= 10} onClick={() => openForm()} type="button"><Plus className="size-4" /> Thêm địa chỉ</button></div>
    {notice && <div className="mt-4"><AuthNotice tone="success">{notice}</AuthNotice></div>}
    {error && <div className="mt-4"><AuthNotice>{error}</AuthNotice><button className="mt-2 min-h-10 text-sm font-semibold text-[#37665b] underline" onClick={load} type="button">Tải lại danh sách</button></div>}
    {loading ? <div aria-live="polite" className="mt-6 space-y-3"><div className="h-28 animate-pulse rounded-xl bg-[#f1f5f1]" /><div className="h-28 animate-pulse rounded-xl bg-[#f1f5f1]" /></div> : addresses.length === 0 ? <div className="mt-6 rounded-xl border border-dashed border-[#d3e2d6] bg-[#f8faf8] px-5 py-10 text-center"><MapPin className="mx-auto size-8 text-[#78978b]" /><p className="mt-3 font-medium text-[#19352f]">Bạn chưa có địa chỉ nhận hàng</p><p className="mt-1 text-sm text-slate-500">Thêm địa chỉ đầu tiên để dễ quản lý thông tin giao hàng.</p><button className="mt-4 min-h-11 text-sm font-semibold text-[#37665b] underline" onClick={() => openForm()} type="button">Thêm địa chỉ ngay</button></div> : <div className="mt-6 space-y-3">{addresses.map((address, index) => <article className={`rounded-xl border p-4 sm:p-5 ${address.is_default ? 'border-[#a9c8b2] bg-[#f8fbf8]' : 'border-[#e4eae5]'}`} key={address.id}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-[#19352f]">{address.recipient_name}</h3><span className="text-xs text-slate-500">{address.recipient_phone}</span><span className="rounded-full bg-[#edf3ee] px-2 py-0.5 text-xs text-[#3c6355]">{address.label || `Địa chỉ ${index + 1}`}</span>{address.is_default && <span className="inline-flex items-center gap-1 rounded-full bg-[#dcefe1] px-2 py-0.5 text-xs font-semibold text-[#28584a]"><Check className="size-3" /> Mặc định</span>}</div><p className="mt-2 text-sm leading-6 text-slate-600">{address.full_address}</p>{address.delivery_note && <p className="mt-1 text-xs text-slate-500">Ghi chú: {address.delivery_note}</p>}</div><div className="flex flex-wrap gap-1"><button aria-label={`Sửa địa chỉ ${address.recipient_name}`} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#37665b] hover:bg-[#eaf1eb]" onClick={() => openForm(address)} type="button"><Pencil className="size-3.5" /> Sửa</button><button aria-label={`Xóa địa chỉ ${address.recipient_name}`} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-rose-700 hover:bg-rose-50" onClick={() => setDeleteTarget(address)} type="button"><Trash2 className="size-3.5" /> Xóa</button></div></div>{!address.is_default && <button className="mt-2 min-h-10 text-xs font-semibold text-[#37665b] underline disabled:opacity-50" disabled={actingId === address.id} onClick={() => makeDefault(address.id)} type="button">Đặt làm mặc định</button>}</article>)}</div>}

    <Dialog.Root onOpenChange={(open) => { if (!saving) setDialogOpen(open); }} open={dialogOpen}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10241f]/45" /><Dialog.Content aria-describedby="address-dialog-description" className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(92dvh,850px)] w-[calc(100vw-1.5rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl focus:outline-none"><div className="flex items-start justify-between gap-3 border-b border-[#e6ede7] px-5 py-4"><div><Dialog.Title className="text-lg font-semibold text-[#19352f]">{editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}</Dialog.Title><Dialog.Description className="mt-1 text-xs text-slate-500" id="address-dialog-description">Nhập tỉnh/thành phố và phường/xã theo địa chỉ hiện tại.</Dialog.Description></div><Dialog.Close aria-label="Đóng" className="grid size-9 place-items-center rounded-full hover:bg-[#eff3ef]"><X className="size-4" /></Dialog.Close></div><form className="overflow-y-auto px-5 py-4" onSubmit={save}>{dialogError && <div className="mb-4"><AuthNotice>{dialogError}</AuthNotice></div>}<div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label className="text-sm font-medium text-[#29483f]" htmlFor="address-label">Nhãn địa chỉ</label><input className={authInputClass} id="address-label" list="address-label-options" maxLength={30} onChange={(event) => setDraft({ ...draft, label: event.target.value })} value={draft.label} /><datalist id="address-label-options"><option value="Nhà riêng" /><option value="Công ty" /></datalist>{fieldErrors.label && <p className="mt-1 text-xs text-rose-700" role="alert">{fieldErrors.label?.[0] ?? fieldErrors.label}</p>}</div>{fields.map(([key, label, type, autoComplete, required]) => <div className={['street', 'detail', 'delivery_note'].includes(key) ? 'sm:col-span-2' : ''} key={key}><label className="text-sm font-medium text-[#29483f]" htmlFor={`address-${key}`}>{label}{required ? ' *' : ''}</label><input aria-invalid={Boolean(fieldErrors[key])} autoComplete={autoComplete} className={authInputClass} id={`address-${key}`} inputMode={type === 'tel' ? 'tel' : undefined} maxLength={key === 'recipient_phone' ? 16 : key === 'delivery_note' ? 500 : key === 'street' || key === 'detail' ? 200 : key === 'recipient_name' ? 150 : 100} onChange={(event) => { setDraft({ ...draft, [key]: event.target.value }); setFieldErrors({ ...fieldErrors, [key]: undefined }); }} required={required} type={type} value={draft[key] ?? ''} />{fieldErrors[key] && <p className="mt-1 text-xs text-rose-700" role="alert">{fieldErrors[key]?.[0] ?? fieldErrors[key]}</p>}</div>)}</div><div className="sticky bottom-0 mt-5 flex justify-end gap-2 border-t border-[#e6ede7] bg-white py-3"><button className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-[#f3f6f3]" onClick={() => setDialogOpen(false)} type="button">Hủy</button><button className={authButtonClass} disabled={saving} type="submit">{saving ? 'Đang lưu…' : 'Lưu địa chỉ'}</button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>

    <Dialog.Root onOpenChange={(open) => { if (!actingId && !open) setDeleteTarget(null); }} open={Boolean(deleteTarget)}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10241f]/45" /><Dialog.Content aria-describedby="delete-address-description" className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl"><Dialog.Title className="text-lg font-semibold text-[#19352f]">Xóa địa chỉ này?</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-6 text-slate-600" id="delete-address-description">Địa chỉ của {deleteTarget?.recipient_name} sẽ bị xóa khỏi sổ địa chỉ. Nếu đây là địa chỉ mặc định, một địa chỉ còn lại sẽ được chọn thay thế.</Dialog.Description><div className="mt-6 flex justify-end gap-2"><Dialog.Close className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600" disabled={Boolean(actingId)}>Hủy</Dialog.Close><button className="min-h-11 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={Boolean(actingId)} onClick={remove} type="button">{actingId ? 'Đang xóa…' : 'Xóa địa chỉ'}</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
  </section>;
}
