"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AdminImageUpload } from "@/components/admin/media/AdminImageUpload";
import { ApiError } from "@/lib/apiError";
import { brandAdminService, type BrandPayload } from "@/services/admin/brandAdminService";
import { slugify } from "@/utils/slug";

type BrandFormState = Required<Omit<BrandPayload, "logo">> & { logo: string };
const blank: BrandFormState = { name: "", slug: "", logo: "", status: "active" };

export function BrandForm({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<BrandFormState>(blank);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [slugEdited, setSlugEdited] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;
    void brandAdminService.getBrand(id)
      .then((brand) => setForm({ name: brand.name, slug: brand.slug, logo: brand.logo ?? "", status: brand.status === "inactive" ? "inactive" : "active" }))
      .catch((reason: Error) => setMessage(reason.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setErrors({});

    const payload: BrandPayload = { ...form, slug: form.slug || undefined, logo: form.logo || undefined };
    try {
      if (id) await brandAdminService.updateBrand(id, payload);
      else await brandAdminService.createBrand(payload);
      router.push("/admin/brands");
    } catch (reason) {
      if (reason instanceof ApiError) {
        setErrors(reason.errors);
        if (reason.status === 401) router.push("/admin/login");
      }
      setMessage(reason instanceof Error ? reason.message : "Không thể lưu thương hiệu.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Đang tải thương hiệu...</p>;

  return <form onSubmit={submit} className="grid max-w-3xl gap-5 rounded-md border border-slate-200 bg-white p-6 shadow-sm"><Field label="Tên thương hiệu" error={errors.name?.[0]} value={form.name} required onChange={(name) => setForm((current) => ({ ...current, name, slug: slugEdited ? current.slug : slugify(name) }))} /><Field label="Slug" error={errors.slug?.[0]} value={form.slug} onChange={(slug) => { setSlugEdited(true); setForm((current) => ({ ...current, slug })); }} /><label className="grid gap-2 text-sm font-semibold text-slate-700">Logo<AdminImageUpload value={form.logo} directory="brands" onChange={(logo) => setForm((current) => ({ ...current, logo }))} />{errors.logo?.[0] ? <span className="text-xs font-normal text-rose-700">{errors.logo[0]}</span> : null}</label><label className="text-sm font-semibold text-slate-700">Trạng thái<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as BrandPayload["status"] }))} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal"><option value="active">Đang hoạt động</option><option value="inactive">Đã tắt</option></select>{errors.status?.[0] ? <span className="mt-1 block text-xs font-normal text-rose-700">{errors.status[0]}</span> : null}</label>{message ? <p role="alert" className="text-sm text-rose-700">{message}</p> : null}<div className="flex gap-2"><button disabled={saving} className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Đang lưu..." : "Lưu thương hiệu"}</button><button type="button" onClick={() => router.push("/admin/brands")} className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold">Hủy</button></div></form>;
}

function Field({ label, value, onChange, required = false, error }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; error?: string }) {
  return <label className="text-sm font-semibold text-slate-700">{label}<input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" />{error ? <span className="mt-1 block text-xs font-normal text-rose-700">{error}</span> : null}</label>;
}
