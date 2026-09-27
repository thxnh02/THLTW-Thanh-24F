"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminImageUpload } from "@/components/AdminImageUpload";
import { ApiError, apiGet, apiPut } from "@/lib/api";
import type { Setting } from "@/types/api";

type SettingSpec = { key: string; label: string; type: Setting["type"]; image?: boolean };
type SettingGroup = { title: string; fields: SettingSpec[] };

const groups: SettingGroup[] = [
  { title: "Thông tin cửa hàng", fields: [
    { key: "website_name", label: "Tên cửa hàng", type: "string" },
    { key: "email", label: "Email liên hệ", type: "string" },
    { key: "phone", label: "Số điện thoại", type: "string" },
    { key: "address", label: "Địa chỉ", type: "string" },
  ] },
  { title: "Hình ảnh thương hiệu", fields: [
    { key: "logo", label: "Logo", type: "string", image: true },
    { key: "website_logo", label: "Logo website", type: "string", image: true },
    { key: "favicon", label: "Favicon", type: "string", image: true },
    { key: "og_image", label: "Ảnh chia sẻ mạng xã hội", type: "string", image: true },
  ] },
  { title: "Vận hành cửa hàng", fields: [
    { key: "shipping_fee", label: "Phí vận chuyển mặc định", type: "number" },
    { key: "free_shipping_threshold", label: "Mức miễn phí vận chuyển", type: "number" },
    { key: "low_stock_threshold", label: "Ngưỡng cảnh báo tồn kho", type: "number" },
    { key: "return_window_days", label: "Thời hạn đổi trả (ngày)", type: "number" },
  ] },
  { title: "Thông tin xuất hóa đơn", fields: [
    { key: "invoice_company_name", label: "Tên công ty", type: "string" },
    { key: "invoice_company_address", label: "Địa chỉ công ty", type: "string" },
    { key: "invoice_company_phone", label: "Điện thoại công ty", type: "string" },
    { key: "invoice_company_email", label: "Email công ty", type: "string" },
  ] },
];

export default function AdminSettingsPage() {
  const router = useRouter(); const [settings, setSettings] = useState<Setting[]>([]); const [message, setMessage] = useState(""); const [saving, setSaving] = useState(false);
  const load = useCallback(() => { apiGet<Setting[]>("/admin/settings").then(setSettings).catch((reason: Error) => { if (reason instanceof ApiError && reason.status === 401) router.push("/admin/login"); else setMessage(reason.message); }); }, [router]);
  useEffect(() => { load(); }, [load]);
  const knownKeys = useMemo(() => new Set(groups.flatMap((group) => group.fields.map((field) => field.key))), []);
  function getSetting(spec: SettingSpec): Setting { return settings.find((setting) => setting.key === spec.key) ?? { id: 0, key: spec.key, value: spec.type === "number" ? "0" : "", type: spec.type }; }
  function updateValue(spec: SettingSpec, value: string) { setSettings((current) => { const index = current.findIndex((setting) => setting.key === spec.key); const next = { id: index >= 0 ? current[index].id : 0, key: spec.key, value, type: spec.type }; return index >= 0 ? current.map((setting, itemIndex) => itemIndex === index ? { ...setting, ...next } : setting) : [...current, next]; }); }
  async function save() { setSaving(true); try { await apiPut("/admin/settings", { settings }); setMessage("Đã lưu cấu hình."); load(); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Không thể lưu cấu hình."); } finally { setSaving(false); } }
  return <main className="mx-auto max-w-5xl px-4 py-8"><div className="flex items-center justify-between gap-3"><div><h1 className="text-3xl font-bold text-slate-950">Cấu hình cửa hàng</h1><p className="mt-1 text-sm text-slate-500">Thiết lập thông tin hiển thị và quy tắc vận hành.</p></div><button type="button" onClick={() => void save()} disabled={saving} className="rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white">{saving ? "Đang lưu..." : "Lưu cấu hình"}</button></div>{message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}<div className="mt-6 grid gap-5">{groups.map((group) => <section key={group.title} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-950">{group.title}</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{group.fields.map((spec) => { const setting = getSetting(spec); return <label key={spec.key} className="grid gap-2 text-sm font-semibold text-slate-700">{spec.label}{spec.image ? <AdminImageUpload value={setting.value ?? ""} directory="settings" onChange={(value) => updateValue(spec, value)} /> : <input type={spec.type === "number" ? "number" : "text"} value={setting.value ?? ""} onChange={(event) => updateValue(spec, event.target.value)} className="h-10 rounded-md border border-slate-300 px-3 font-normal" />}</label>; })}</div></section>)}</div><section className="mt-5 rounded-md border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-950">Cấu hình nâng cao</h2><p className="mt-1 text-sm text-slate-500">Các key mở rộng vẫn được giữ nguyên khi lưu và chỉ dùng khi bạn biết rõ tác dụng.</p><div className="mt-4 grid gap-3">{settings.filter((setting) => !knownKeys.has(setting.key)).map((setting) => <div key={setting.id} className="grid gap-2 md:grid-cols-[1fr_2fr_160px]"><input value={setting.key} onChange={(event) => setSettings((current) => current.map((item) => item.id === setting.id ? { ...item, key: event.target.value } : item))} className="h-10 rounded-md border border-slate-300 px-3" /><input value={setting.value ?? ""} onChange={(event) => setSettings((current) => current.map((item) => item.id === setting.id ? { ...item, value: event.target.value } : item))} className="h-10 rounded-md border border-slate-300 px-3" /><select value={setting.type} onChange={(event) => setSettings((current) => current.map((item) => item.id === setting.id ? { ...item, type: event.target.value as Setting["type"] } : item))} className="h-10 rounded-md border border-slate-300 px-3"><option value="string">Văn bản</option><option value="number">Số</option><option value="boolean">Đúng/Sai</option><option value="json">JSON</option></select></div>)}</div></section></main>;
}
