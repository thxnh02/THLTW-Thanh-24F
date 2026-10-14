"use client";

import Link from "next/link";
import { useState } from "react";
import AdminImageField from "@/components/admin/AdminImageField";
import AdminSlugField from "@/components/admin/AdminSlugField";
import { slugify } from "@/lib/slugify.mjs";

const blank = { name: "", slug: "", logo: "", logo_file: null, description: "", sort_order: 0, status: true };

// Form dùng chung cho thêm/sửa thương hiệu; onSubmit chuyển dữ liệu cho trang đang mở.
export default function BrandForm({ initialData = blank, onSubmit, submitting, errors = {}, cancelHref = "/admin/brand" }) {
  const [form, setForm] = useState({ ...blank, ...initialData });
  const [slugManual, setSlugManual] = useState(false);

  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value, ...(name === "name" && !slugManual ? { slug: slugify(value) } : {}) }));
    if (name === "slug") setSlugManual(Boolean(value.trim()));
  };
  const resetSlug = () => {
    setForm((current) => ({ ...current, slug: slugify(current.name) }));
    setSlugManual(false);
  };
  // Chuẩn hóa thứ tự và trạng thái trước khi trang cha gọi API.
  const submit = (event) => { event.preventDefault(); onSubmit({ ...form, sort_order: Number(form.sort_order), status: Boolean(form.status) }); };
  const message = (name) => errors[name]?.[0];
  const fieldProps = (name) => ({ "aria-describedby": message(name) ? `${name}-error` : undefined, "aria-invalid": Boolean(message(name)) });

  return (
    <form className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8" onSubmit={submit}>
      <label className="admin-label">Tên thương hiệu<input {...fieldProps("name")} className="admin-input" name="name" required value={form.name} onChange={change} />{message("name") && <small className="mt-1 block text-rose-700" id="name-error" role="alert">{message("name")}</small>}</label>
      <AdminSlugField error={message("slug")} manual={slugManual} maxLength={170} value={form.slug} onChange={change} onReset={resetSlug} />
      <AdminImageField errors={errors} file={form.logo_file} fileName="logo_file" label="Logo thương hiệu" name="logo" value={form.logo} onFileChange={(file) => setForm((current) => ({ ...current, logo_file: file }))} onUrlChange={(logo) => setForm((current) => ({ ...current, logo }))} />
      <label className="admin-label">Mô tả<textarea {...fieldProps("description")} className="admin-input min-h-24" name="description" value={form.description ?? ""} onChange={change} />{message("description") && <small className="mt-1 block text-rose-700" id="description-error" role="alert">{message("description")}</small>}</label>
      <label className="admin-label">Thứ tự<input {...fieldProps("sort_order")} className="admin-input" min="0" name="sort_order" type="number" value={form.sort_order} onChange={change} />{message("sort_order") && <small className="mt-1 block text-rose-700" id="sort_order-error" role="alert">{message("sort_order")}</small>}</label>
      <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-slate-700"><input checked={form.status} className="h-4 w-4 accent-indigo-700" name="status" type="checkbox" onChange={change} /> Hiển thị</label>
      {message("status") && <small className="block text-rose-700" id="status-error" role="alert">{message("status")}</small>}
      <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
        <Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href={cancelHref}>Hủy</Link>
        <button className="min-h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50" disabled={submitting}>{submitting ? "Đang lưu…" : initialData.id ? "Lưu thay đổi" : "Thêm thương hiệu"}</button>
      </div>
    </form>
  );
}
