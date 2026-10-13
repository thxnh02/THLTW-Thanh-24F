"use client";

import { useState } from "react";

const blank = { name: "", slug: "", parent_id: "", description: "", image: "", sort_order: 0, status: true };

export default function CategoryForm({ initialData = blank, categories = [], onSubmit, submitting, errors = {} }) {
  const [form, setForm] = useState({ ...blank, ...initialData, parent_id: initialData.parent_id ?? "" });
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value });
  const submit = (event) => { event.preventDefault(); onSubmit({ ...form, parent_id: form.parent_id || null, sort_order: Number(form.sort_order), status: Boolean(form.status) }); };
  const message = (name) => errors[name]?.[0];
  return <form className="space-y-4 rounded border bg-white p-5" onSubmit={submit}>
    <label className="block">Tên<input className="mt-1 w-full rounded border p-2" name="name" value={form.name} onChange={change} required />{message("name") && <small className="text-red-600">{message("name")}</small>}</label>
    <label className="block">Slug<input className="mt-1 w-full rounded border p-2" name="slug" value={form.slug} onChange={change} required />{message("slug") && <small className="text-red-600">{message("slug")}</small>}</label>
    <label className="block">Danh mục cha<select className="mt-1 w-full rounded border p-2" name="parent_id" value={form.parent_id} onChange={change}><option value="">Không có</option>{categories.filter((item) => item.id !== initialData.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label className="block">Mô tả<textarea className="mt-1 w-full rounded border p-2" name="description" value={form.description ?? ""} onChange={change} /></label>
    <label className="block">Đường dẫn ảnh<input className="mt-1 w-full rounded border p-2" name="image" value={form.image ?? ""} onChange={change} /></label>
    <label className="block">Thứ tự<input className="mt-1 w-full rounded border p-2" min="0" name="sort_order" type="number" value={form.sort_order} onChange={change} /></label>
    <label className="flex gap-2"><input checked={form.status} name="status" type="checkbox" onChange={change} /> Hiển thị</label>
    <button className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50" disabled={submitting}>{submitting ? "Đang lưu..." : "Lưu danh mục"}</button>
  </form>;
}
