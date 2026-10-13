"use client";

import { useState } from "react";

const blank = { name: "", slug: "", logo: "", description: "", sort_order: 0, status: true };

export default function BrandForm({ initialData = blank, onSubmit, submitting, errors = {} }) {
  const [form, setForm] = useState({ ...blank, ...initialData });
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value });
  const submit = (event) => { event.preventDefault(); onSubmit({ ...form, sort_order: Number(form.sort_order), status: Boolean(form.status) }); };
  const message = (name) => errors[name]?.[0];
  return <form className="space-y-4 rounded border bg-white p-5" onSubmit={submit}>
    <label className="block">Tên<input className="mt-1 w-full rounded border p-2" name="name" value={form.name} onChange={change} required />{message("name") && <small className="text-red-600">{message("name")}</small>}</label>
    <label className="block">Slug<input className="mt-1 w-full rounded border p-2" name="slug" value={form.slug} onChange={change} required />{message("slug") && <small className="text-red-600">{message("slug")}</small>}</label>
    <label className="block">Đường dẫn logo<input className="mt-1 w-full rounded border p-2" name="logo" value={form.logo ?? ""} onChange={change} /></label>
    <label className="block">Mô tả<textarea className="mt-1 w-full rounded border p-2" name="description" value={form.description ?? ""} onChange={change} /></label>
    <label className="block">Thứ tự<input className="mt-1 w-full rounded border p-2" min="0" name="sort_order" type="number" value={form.sort_order} onChange={change} /></label>
    <label className="flex gap-2"><input checked={form.status} name="status" type="checkbox" onChange={change} /> Hiển thị</label>
    <button className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50" disabled={submitting}>{submitting ? "Đang lưu..." : "Lưu thương hiệu"}</button>
  </form>;
}
