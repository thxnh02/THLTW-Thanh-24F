"use client";

import Link from "next/link";
import { useState } from "react";

const blank = { name: "", slug: "", logo: "", description: "", sort_order: 0, status: true };

export default function BrandForm({ initialData = blank, onSubmit, submitting, errors = {}, cancelHref = "/admin/brand" }) {
  const [form, setForm] = useState({ ...blank, ...initialData });

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const submit = (event) => { event.preventDefault(); onSubmit({ ...form, sort_order: Number(form.sort_order), status: Boolean(form.status) }); };
  const message = (name) => errors[name]?.[0];
  const fieldProps = (name) => ({ "aria-describedby": message(name) ? `${name}-error` : undefined, "aria-invalid": Boolean(message(name)) });

  return (
    <form className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8" onSubmit={submit}>
      <label className="admin-label">Tên thương hiệu<input {...fieldProps("name")} className="admin-input" name="name" required value={form.name} onChange={change} />{message("name") && <small className="mt-1 block text-rose-700" id="name-error" role="alert">{message("name")}</small>}</label>
      <label className="admin-label">Đường dẫn<input {...fieldProps("slug")} className="admin-input" name="slug" required value={form.slug} onChange={change} />{message("slug") && <small className="mt-1 block text-rose-700" id="slug-error" role="alert">{message("slug")}</small>}</label>
      <label className="admin-label">Đường dẫn logo<input {...fieldProps("logo")} className="admin-input" name="logo" value={form.logo ?? ""} onChange={change} />{message("logo") && <small className="mt-1 block text-rose-700" id="logo-error" role="alert">{message("logo")}</small>}</label>
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
