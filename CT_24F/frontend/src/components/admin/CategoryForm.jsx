"use client";

import Link from "next/link";
import { useState } from "react";

const blank = { name: "", slug: "", parent_id: "", description: "", image: "", sort_order: 0, status: true };

function descendantsOf(categories, categoryId) {
  const excluded = new Set(categoryId ? [Number(categoryId)] : []);
  const pending = [...excluded];

  while (pending.length) {
    const parentId = pending.pop();
    for (const category of categories) {
      if (Number(category.parent_id) === parentId && !excluded.has(Number(category.id))) {
        excluded.add(Number(category.id));
        pending.push(Number(category.id));
      }
    }
  }

  return excluded;
}

export default function CategoryForm({ initialData = blank, categories = [], onSubmit, submitting, errors = {}, cancelHref = "/admin/category" }) {
  const [form, setForm] = useState({ ...blank, ...initialData, parent_id: initialData.parent_id ?? "" });

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    onSubmit({ ...form, parent_id: form.parent_id || null, sort_order: Number(form.sort_order), status: Boolean(form.status) });
  };
  const message = (name) => errors[name]?.[0];
  const excludedParents = descendantsOf(categories, initialData.id);
  const fieldProps = (name) => ({ "aria-describedby": message(name) ? `${name}-error` : undefined, "aria-invalid": Boolean(message(name)) });

  return (
    <form className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8" onSubmit={submit}>
      <label className="admin-label">Name<input {...fieldProps("name")} className="admin-input" name="name" required value={form.name} onChange={change} />{message("name") && <small className="mt-1 block text-rose-700" id="name-error" role="alert">{message("name")}</small>}</label>
      <label className="admin-label">Slug<input {...fieldProps("slug")} className="admin-input" name="slug" required value={form.slug} onChange={change} />{message("slug") && <small className="mt-1 block text-rose-700" id="slug-error" role="alert">{message("slug")}</small>}</label>
      <label className="admin-label">Parent category<select {...fieldProps("parent_id")} className="admin-input" name="parent_id" value={form.parent_id} onChange={change}><option value="">None</option>{categories.filter((item) => !excludedParents.has(Number(item.id))).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{message("parent_id") && <small className="mt-1 block text-rose-700" id="parent_id-error" role="alert">{message("parent_id")}</small>}</label>
      <label className="admin-label">Description<textarea {...fieldProps("description")} className="admin-input min-h-24" name="description" value={form.description ?? ""} onChange={change} />{message("description") && <small className="mt-1 block text-rose-700" id="description-error" role="alert">{message("description")}</small>}</label>
      <label className="admin-label">Image URL<input {...fieldProps("image")} className="admin-input" name="image" value={form.image ?? ""} onChange={change} />{message("image") && <small className="mt-1 block text-rose-700" id="image-error" role="alert">{message("image")}</small>}</label>
      <label className="admin-label">Sort order<input {...fieldProps("sort_order")} className="admin-input" min="0" name="sort_order" type="number" value={form.sort_order} onChange={change} />{message("sort_order") && <small className="mt-1 block text-rose-700" id="sort_order-error" role="alert">{message("sort_order")}</small>}</label>
      <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-slate-700"><input checked={form.status} className="h-4 w-4 accent-indigo-700" name="status" type="checkbox" onChange={change} /> Visible</label>
      {message("status") && <small className="block text-rose-700" id="status-error" role="alert">{message("status")}</small>}
      <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
        <Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href={cancelHref}>Cancel</Link>
        <button className="min-h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50" disabled={submitting}>{submitting ? "Saving…" : initialData.id ? "Save changes" : "Create category"}</button>
      </div>
    </form>
  );
}
