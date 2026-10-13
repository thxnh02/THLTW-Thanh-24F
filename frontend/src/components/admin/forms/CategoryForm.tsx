"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AdminImageUpload } from "@/components/admin/media/AdminImageUpload";
import { ApiError } from "@/lib/apiError";
import { categoryAdminService, type CategoryPayload } from "@/services/admin/categoryAdminService";
import { slugify } from "@/utils/slug";

type CategoryFormState = Required<Omit<CategoryPayload, "image">> & { image: string };

const blank: CategoryFormState = { name: "", slug: "", image: "", status: "active", sort_order: 0 };

export function CategoryForm({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<CategoryFormState>(blank);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [slugEdited, setSlugEdited] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;

    void categoryAdminService.getCategory(id)
      .then((category) => setForm({ name: category.name, slug: category.slug, image: category.image ?? "", status: category.status === "inactive" ? "inactive" : "active", sort_order: category.sort_order ?? 0 }))
      .catch((reason: Error) => setMessage(reason.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setErrors({});

    const payload: CategoryPayload = { ...form, slug: form.slug || undefined, image: form.image || undefined };
    try {
      if (id) await categoryAdminService.updateCategory(id, payload);
      else await categoryAdminService.createCategory(payload);
      router.push("/admin/categories");
    } catch (reason) {
      if (reason instanceof ApiError) {
        setErrors(reason.errors);
        if (reason.status === 401) router.push("/admin/login");
      }
      setMessage(reason instanceof Error ? reason.message : "Không thể lưu danh mục.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Đang tải danh mục...</p>;

  return (
    <form onSubmit={submit} className="grid max-w-3xl gap-5 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      <Field label="Tên danh mục" error={errors.name?.[0]} value={form.name} required onChange={(name) => setForm((current) => ({ ...current, name, slug: slugEdited ? current.slug : slugify(name) }))} />
      <Field label="Slug" error={errors.slug?.[0]} value={form.slug} onChange={(slug) => { setSlugEdited(true); setForm((current) => ({ ...current, slug })); }} />
      <label className="grid gap-2 text-sm font-semibold text-slate-700">Ảnh danh mục<AdminImageUpload value={form.image} directory="categories" onChange={(image) => setForm((current) => ({ ...current, image }))} />{errors.image?.[0] ? <span className="text-xs font-normal text-rose-700">{errors.image[0]}</span> : null}</label>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Thứ tự" error={errors.sort_order?.[0]} type="number" value={String(form.sort_order)} onChange={(sort_order) => setForm((current) => ({ ...current, sort_order: Number(sort_order) || 0 }))} />
        <label className="text-sm font-semibold text-slate-700">Trạng thái<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as CategoryPayload["status"] }))} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal"><option value="active">Đang hoạt động</option><option value="inactive">Đã tắt</option></select>{errors.status?.[0] ? <span className="mt-1 block text-xs font-normal text-rose-700">{errors.status[0]}</span> : null}</label>
      </div>
      {message ? <p role="alert" className="text-sm text-rose-700">{message}</p> : null}
      <div className="flex gap-2"><button disabled={saving} className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Đang lưu..." : "Lưu danh mục"}</button><button type="button" onClick={() => router.push("/admin/categories")} className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold">Hủy</button></div>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", required = false, error }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; error?: string }) {
  return <label className="text-sm font-semibold text-slate-700">{label}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" />{error ? <span className="mt-1 block text-xs font-normal text-rose-700">{error}</span> : null}</label>;
}
