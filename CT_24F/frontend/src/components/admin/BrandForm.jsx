"use client";

import { useState } from "react";

const blank = { name: "", slug: "", logo: "", description: "", sort_order: 0, status: true };

export default function BrandForm({ initialData = blank, onSubmit, submitting, errors = {} }) {
  const [form, setForm] = useState({ ...blank, ...initialData });
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value });
  const submit = (event) => { event.preventDefault(); onSubmit({ ...form, sort_order: Number(form.sort_order), status: Boolean(form.status) }); };
  const message = (name) => errors[name]?.[0];
  return <form className="space-y-5 rounded-2xl border border-[#e7ece8] bg-white p-6 shadow-sm sm:p-8" onSubmit={submit}>
    <label className="admin-label">Tên<input className="admin-input" name="name" value={form.name} onChange={change} required />{message("name") && <small className="mt-1 block text-red-600">{message("name")}</small>}</label>
    <label className="admin-label">Slug<input className="admin-input" name="slug" value={form.slug} onChange={change} required />{message("slug") && <small className="mt-1 block text-red-600">{message("slug")}</small>}</label>
    <label className="admin-label">Đường dẫn logo<input className="admin-input" name="logo" value={form.logo ?? ""} onChange={change} /></label>
    <label className="admin-label">Mô tả<textarea className="admin-input min-h-24" name="description" value={form.description ?? ""} onChange={change} /></label>
    <label className="admin-label">Thứ tự<input className="admin-input" min="0" name="sort_order" type="number" value={form.sort_order} onChange={change} /></label>
    <label className="flex items-center gap-3 text-sm font-medium text-slate-700"><input checked={form.status} className="h-4 w-4 accent-[#37665b]" name="status" type="checkbox" onChange={change} /> Hiển thị</label>
    <button className="rounded-full bg-[#193b34] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#28564d] disabled:opacity-50" disabled={submitting}>{submitting ? "Đang lưu..." : "Lưu thương hiệu"}</button>
  </form>;
}
