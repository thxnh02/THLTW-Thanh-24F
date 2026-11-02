"use client";

import { useEffect, useRef, useState } from 'react';
import { Dialog } from 'radix-ui';
import { X } from 'lucide-react';
import { AuthNotice, authButtonClass, authInputClass } from '@/components/shop/AuthFormShell';
import { changeAddressProvince } from '@/lib/accountAddressForm.mjs';
import provinces from '@/data/vietnam-administrative-2025.json';

const normalize = (value) => value.trim().toLocaleLowerCase('vi');
const matchProvince = (value) => provinces.find((item) => normalize(item.name) === normalize(value));

function AddressInput({ draft, fieldErrors, label, name, onChange, required = false, ...props }) {
  const id = `address-${name}`;
  return <div>
    <label className="text-sm font-medium text-[#29483f]" htmlFor={id}>{label}{required ? ' *' : ''}</label>
    <input aria-describedby={fieldErrors[name] ? `${id}-error` : undefined} aria-invalid={Boolean(fieldErrors[name])} className={authInputClass} id={id} name={name} onChange={(event) => onChange(name, event.target.value)} required={required} value={draft[name] ?? ''} {...props} />
    {fieldErrors[name] && <p className="mt-1 text-xs text-rose-700" id={`${id}-error`} role="alert">{fieldErrors[name]?.[0] ?? fieldErrors[name]}</p>}
  </div>;
}

function AddressForm({ draft, onDraftChange, fieldErrors, onFieldChange, dialogError, saving, onSubmit, onCancel, editing }) {
  const [provinceInput, setProvinceInput] = useState(draft.province);
  const [committedProvince, setCommittedProvince] = useState(draft.province);
  const committedRef = useRef(draft.province);
  const draftRef = useRef(draft);
  useEffect(() => { draftRef.current = draft; }, [draft]);
  const selectedProvince = matchProvince(committedProvince);

  const commitProvince = (value) => {
    const next = value.trim();
    if (next === committedRef.current) {
      const matched = matchProvince(next);
      if (matched && !draftRef.current.province_code) {
        const updated = { ...draftRef.current, province_code: matched.code };
        draftRef.current = updated;
        onDraftChange(updated);
        return updated;
      }
      return draftRef.current;
    }
    const matched = matchProvince(next);
    const canonical = matched?.name ?? next;
    const confirmed = !draftRef.current.ward || window.confirm('Đổi tỉnh/thành phố sẽ xóa phường/xã đang nhập. Bạn có muốn tiếp tục?');
    if (!confirmed) { setProvinceInput(committedRef.current); return null; }
    const nextDraft = changeAddressProvince(draftRef.current, canonical, matched?.code ?? '', true);
    draftRef.current = nextDraft;
    onDraftChange(nextDraft);
    committedRef.current = canonical;
    setCommittedProvince(canonical);
    setProvinceInput(canonical);
    return nextDraft;
  };

  const handleSubmit = (event) => {
    const nextDraft = provinceInput.trim() !== committedRef.current ? commitProvince(provinceInput) : draftRef.current;
    if (!nextDraft) { event.preventDefault(); return; }
    onSubmit(event, nextDraft);
  };

  return <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 overscroll-contain sm:px-6">
      {dialogError && <AuthNotice>{dialogError}</AuthNotice>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><AddressInput draft={draft} fieldErrors={fieldErrors} label="Nhãn địa chỉ" list="address-label-options" maxLength={30} name="label" onChange={onFieldChange} required /><datalist id="address-label-options"><option value="Nhà riêng" /><option value="Công ty" /><option value="Khác" /></datalist></div>
        <AddressInput autoComplete="name" draft={draft} fieldErrors={fieldErrors} label="Tên người nhận" maxLength={150} name="recipient_name" onChange={onFieldChange} required />
        <div><AddressInput autoComplete="tel" draft={draft} fieldErrors={fieldErrors} inputMode="tel" label="Số điện thoại" maxLength={16} name="recipient_phone" onChange={onFieldChange} required type="tel" /><p className="mt-1 text-xs text-slate-500">Ví dụ: 0912345678 hoặc +84912345678</p></div>
        <div><label className="text-sm font-medium text-[#29483f]" htmlFor="address-province">Tỉnh / Thành phố *</label><input aria-describedby={fieldErrors.province ? 'address-province-error' : 'address-province-help'} aria-invalid={Boolean(fieldErrors.province)} autoComplete="address-level1" className={authInputClass} id="address-province" list="address-province-options" maxLength={100} onBlur={() => commitProvince(provinceInput)} onChange={(event) => { const value = event.target.value; setProvinceInput(value); if (matchProvince(value)) commitProvince(value); }} required value={provinceInput} /><datalist id="address-province-options">{provinces.map((item) => <option key={item.code} value={item.name} />)}</datalist><p className="mt-1 text-xs text-slate-500" id="address-province-help">Gõ để tìm; có thể nhập tay nếu địa danh chưa có trong danh sách.</p>{fieldErrors.province && <p className="mt-1 text-xs text-rose-700" id="address-province-error" role="alert">{fieldErrors.province?.[0] ?? fieldErrors.province}</p>}</div>
        <div><label className="text-sm font-medium text-[#29483f]" htmlFor="address-ward">Phường / Xã / Đặc khu *</label><input aria-describedby={fieldErrors.ward ? 'address-ward-error' : 'address-ward-help'} aria-invalid={Boolean(fieldErrors.ward)} autoComplete="address-level3" className={authInputClass} id="address-ward" list="address-ward-options" maxLength={100} onChange={(event) => { const value = event.target.value; const found = selectedProvince?.wards.find((ward) => normalize(ward.name) === normalize(value)); onDraftChange({ ...draft, ward: value, ward_code: found?.code ?? '' }); }} required value={draft.ward} /><datalist id="address-ward-options">{selectedProvince?.wards.map((item) => <option key={item.code} value={item.name} />)}</datalist><p className="mt-1 text-xs text-slate-500" id="address-ward-help">Chọn theo tỉnh/thành phố hoặc nhập tay.</p>{fieldErrors.ward && <p className="mt-1 text-xs text-rose-700" id="address-ward-error" role="alert">{fieldErrors.ward?.[0] ?? fieldErrors.ward}</p>}</div>
        <div className="sm:col-span-2"><AddressInput autoComplete="street-address" draft={draft} fieldErrors={fieldErrors} label="Số nhà, tên đường" maxLength={200} name="street" onChange={onFieldChange} required /></div>
      </div>
      <details className="rounded-xl border border-[#e3ebe5] p-3"><summary className="min-h-8 cursor-pointer text-sm font-medium text-[#37665b]">Thông tin bổ sung (không bắt buộc)</summary><div className="mt-3 grid gap-4"><AddressInput draft={draft} fieldErrors={fieldErrors} label="Căn hộ, tầng hoặc chỉ dẫn" maxLength={200} name="detail" onChange={onFieldChange} /><AddressInput draft={draft} fieldErrors={fieldErrors} label="Ghi chú giao hàng" maxLength={500} name="delivery_note" onChange={onFieldChange} /></div></details>
      <details className="rounded-xl border border-[#e3ebe5] p-3"><summary className="min-h-8 cursor-pointer text-sm font-medium text-[#37665b]">Thông tin địa chỉ cũ (nếu có)</summary><div className="mt-3"><AddressInput autoComplete="address-level2" draft={draft} fieldErrors={fieldErrors} label="Quận / Huyện cũ" maxLength={100} name="district" onChange={onFieldChange} /></div></details>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[#e3ebe5] p-3 text-sm font-medium text-[#29483f]"><input checked={Boolean(draft.make_default)} className="size-5 accent-[#193f36]" disabled={Boolean(editing?.is_default)} onChange={(event) => onDraftChange({ ...draft, make_default: event.target.checked })} type="checkbox" /> {editing?.is_default ? 'Đây là địa chỉ mặc định' : 'Đặt làm địa chỉ mặc định'}</label>
    </div>
    <div className="flex shrink-0 justify-end gap-2 border-t border-[#e6ede7] bg-white px-5 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:px-6"><button className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-[#f3f6f3] disabled:opacity-50" disabled={saving} onClick={onCancel} type="button">Hủy</button><button className={authButtonClass} disabled={saving} type="submit">{saving ? 'Đang lưu…' : 'Lưu địa chỉ'}</button></div>
  </form>;
}

export default function AddressFormDialog({ open, setOpen, editing, draft, setDraft, fieldErrors, setFieldErrors, dialogError, saving, onSubmit }) {
  const onFieldChange = (key, value) => { setDraft((current) => ({ ...current, [key]: value })); setFieldErrors((current) => ({ ...current, [key]: undefined })); };
  return <Dialog.Root onOpenChange={(next) => { if (!saving) setOpen(next); }} open={open}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-[#10241f]/45" />
    <Dialog.Content aria-describedby="address-dialog-description" className="fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl focus:outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(36rem,calc(100vw-2rem))] sm:max-h-[min(90dvh,850px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e6ede7] px-5 py-4 sm:px-6"><div><Dialog.Title className="text-lg font-semibold text-[#19352f]">{editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}</Dialog.Title><Dialog.Description className="mt-1 text-xs text-slate-500" id="address-dialog-description">Chọn tỉnh/thành phố và phường/xã hoặc nhập tay khi cần.</Dialog.Description></div><Dialog.Close aria-label="Đóng" className="grid size-9 place-items-center rounded-full hover:bg-[#eff3ef] disabled:opacity-50" disabled={saving} type="button"><X className="size-4" /></Dialog.Close></div>
      <AddressForm key={editing?.id ?? 'new'} draft={draft} onDraftChange={setDraft} fieldErrors={fieldErrors} onFieldChange={onFieldChange} dialogError={dialogError} saving={saving} onSubmit={onSubmit} onCancel={() => { if (!saving) setOpen(false); }} editing={editing} />
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
