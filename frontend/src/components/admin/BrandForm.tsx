"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { slugify } from "@/lib/slug";

type Brand = { id: number; name: string; slug: string; status: string; logo?: string | null };
const blank = { name: "", slug: "", status: "active", logo: "" };

export function BrandForm({ id }: { id?: string }) {
  const router = useRouter(); const [form, setForm] = useState(blank); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(Boolean(id)); const [saving, setSaving] = useState(false); const [slugEdited, setSlugEdited] = useState(Boolean(id));
  useEffect(() => { if (!id) return; apiGet<Brand>(`/admin/brands/${id}`).then((brand) => setForm({ name: brand.name, slug: brand.slug, status: brand.status, logo: brand.logo ?? "" })).catch((reason: Error) => setMessage(reason.message)).finally(() => setLoading(false)); }, [id]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); try { const payload = { ...form, slug: form.slug || undefined, logo: form.logo || undefined }; if (id) await apiPatch(`/admin/brands/${id}`, payload); else await apiPost("/admin/brands", payload); router.push("/admin/brands"); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Khong the luu thuong hieu."); } finally { setSaving(false); } }
  if (loading) return <p className="text-sm text-slate-500">Dang tai...</p>;
  return <form onSubmit={submit} className="grid max-w-3xl gap-5 rounded-md border border-slate-200 bg-white p-6 shadow-sm"><Field label="Ten thuong hieu" value={form.name} required onChange={(name) => setForm({ ...form, name, slug: slugEdited ? form.slug : slugify(name) })} /><Field label="Slug" value={form.slug} onChange={(slug) => { setSlugEdited(true); setForm({ ...form, slug }); }} /><Field label="Logo URL" value={form.logo} onChange={(logo) => setForm({ ...form, logo })} /><label className="text-sm font-semibold text-slate-700">Trang thai<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal"><option value="active">Dang hoat dong</option><option value="inactive">Da tat</option></select></label>{message ? <p className="text-sm text-rose-700">{message}</p> : null}<div className="flex gap-2"><button disabled={saving} className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white">{saving ? "Dang luu..." : "Luu thuong hieu"}</button><button type="button" onClick={() => router.push("/admin/brands")} className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold">Huy</button></div></form>;
}
function Field({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) { return <label className="text-sm font-semibold text-slate-700">{label}<input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" /></label>; }
