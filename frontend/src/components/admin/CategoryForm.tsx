"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiGet, apiPatch, apiPost } from "@/lib/api";
import { slugify } from "@/lib/slug";

type Category = { id: number; name: string; slug: string; status: string; sort_order?: number };

const blank = { name: "", slug: "", status: "active", sort_order: "0" };

export function CategoryForm({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [slugEdited, setSlugEdited] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;
    apiGet<Category>(`/admin/categories/${id}`).then((category) => {
      setForm({ name: category.name, slug: category.slug, status: category.status, sort_order: String(category.sort_order ?? 0) });
    }).catch((reason: Error) => setMessage(reason.message)).finally(() => setLoading(false));
  }, [id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const payload = { ...form, sort_order: Number(form.sort_order), slug: form.slug || undefined };
      if (id) await apiPatch(`/admin/categories/${id}`, payload); else await apiPost("/admin/categories", payload);
      router.push("/admin/categories");
    } catch (reason) { if (reason instanceof ApiError && reason.status === 401) router.push("/admin/login"); else setMessage(reason instanceof Error ? reason.message : "Khong the luu danh muc."); }
    finally { setSaving(false); }
  }

  if (loading) return <p className="text-sm text-slate-500">Dang tai...</p>;
  return <form onSubmit={submit} className="grid max-w-3xl gap-5 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
    <Field label="Ten danh muc" value={form.name} required onChange={(name) => setForm({ ...form, name, slug: slugEdited ? form.slug : slugify(name) })} />
    <Field label="Slug" value={form.slug} onChange={(slug) => { setSlugEdited(true); setForm({ ...form, slug }); }} />
    <div className="grid gap-5 sm:grid-cols-2"><Field label="Thu tu" type="number" value={form.sort_order} onChange={(sort_order) => setForm({ ...form, sort_order })} /><label className="text-sm font-semibold text-slate-700">Trang thai<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal"><option value="active">Dang hoat dong</option><option value="inactive">Da tat</option></select></label></div>
    {message ? <p className="text-sm text-rose-700">{message}</p> : null}
    <div className="flex gap-2"><button disabled={saving} className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white">{saving ? "Dang luu..." : "Luu danh muc"}</button><button type="button" onClick={() => router.push("/admin/categories")} className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold">Huy</button></div>
  </form>;
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="text-sm font-semibold text-slate-700">{label}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" /></label>;
}
