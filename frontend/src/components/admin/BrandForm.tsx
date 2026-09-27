"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiGet, apiPatch, apiPost } from "@/lib/api";
import { AdminImageUpload } from "@/components/AdminImageUpload";
import { slugify } from "@/lib/slug";

type Brand = { id: number; name: string; slug: string; status: string; logo?: string | null };
const blank = { name: "", slug: "", status: "active", logo: "" };

export function BrandForm({ id }: { id?: string }) {
  const router = useRouter(); const [form, setForm] = useState(blank); const [message, setMessage] = useState(""); const [errors, setErrors] = useState<Record<string, string[]>>({}); const [loading, setLoading] = useState(Boolean(id)); const [saving, setSaving] = useState(false); const [slugEdited, setSlugEdited] = useState(Boolean(id));
  useEffect(() => { if (!id) return; apiGet<Brand>(`/admin/brands/${id}`).then((brand) => setForm({ name: brand.name, slug: brand.slug, status: brand.status, logo: brand.logo ?? "" })).catch((reason: Error) => setMessage(reason.message)).finally(() => setLoading(false)); }, [id]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setErrors({}); try { const payload = { ...form, slug: form.slug || undefined, logo: form.logo || undefined }; if (id) await apiPatch(`/admin/brands/${id}`, payload); else await apiPost("/admin/brands", payload); router.push("/admin/brands"); } catch (reason) { if (reason instanceof ApiError) setErrors(reason.errors); setMessage(reason instanceof Error ? reason.message : "Không thể lưu thương hiệu."); } finally { setSaving(false); } }
  if (loading) return <p className="text-sm text-slate-500">Đang tải...</p>;
  return <form onSubmit={submit} className="grid max-w-3xl gap-5 rounded-md border border-slate-200 bg-white p-6 shadow-sm"><Field label="Tên thương hiệu" error={errors.name?.[0]} value={form.name} required onChange={(name) => setForm({ ...form, name, slug: slugEdited ? form.slug : slugify(name) })} /><Field label="Slug" error={errors.slug?.[0]} value={form.slug} onChange={(slug) => { setSlugEdited(true); setForm({ ...form, slug }); }} /><label className="grid gap-2 text-sm font-semibold text-slate-700">Logo<AdminImageUpload value={form.logo} directory="brands" onChange={(logo) => setForm({ ...form, logo })} /></label><label className="text-sm font-semibold text-slate-700">Trạng thái<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal"><option value="active">Đang hoạt động</option><option value="inactive">Đã tắt</option></select></label>{message ? <p className="text-sm text-rose-700">{message}</p> : null}<div className="flex gap-2"><button disabled={saving} className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white">{saving ? "Đang lưu..." : "Lưu thương hiệu"}</button><button type="button" onClick={() => router.push("/admin/brands")} className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold">Hủy</button></div></form>;
}
function Field({ label, value, onChange, required = false, error }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; error?: string }) { return <label className="text-sm font-semibold text-slate-700">{label}<input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" />{error ? <span className="mt-1 block text-xs font-normal text-rose-700">{error}</span> : null}</label>; }
