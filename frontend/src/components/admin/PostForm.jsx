"use client";

import Link from "next/link";
import { useState } from "react";
import { slugify } from "@/lib/slugify.mjs";

export default function PostForm({ initialData, errors = {}, onSubmit, submitting }) {
  const [form, setForm] = useState({ title: initialData?.title ?? "", slug: initialData?.slug ?? "", content: initialData?.content ?? "", status: initialData?.status ?? false });
  const [manualSlug, setManualSlug] = useState(false);
  const message = (field) => errors[field]?.[0];

  const change = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value, ...(name === "title" && !manualSlug ? { slug: slugify(value) } : {}) }));
    if (name === "slug") setManualSlug(Boolean(value.trim()));
  };

  const save = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="space-y-5" onSubmit={save}>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(17rem,1fr)]">
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div><h2 className="text-lg font-semibold text-slate-950">Soạn bài viết</h2><p className="mt-1 text-sm text-slate-500">Tiêu đề ngắn gọn, nội dung rõ ràng.</p></div>
          <label className="admin-label">Tiêu đề<input aria-invalid={Boolean(message("title"))} className="admin-input" maxLength={180} name="title" required value={form.title} onChange={change} />{message("title") && <small className="mt-1 block text-rose-700" role="alert">{message("title")}</small>}</label>
          <label className="admin-label">Nội dung<textarea aria-invalid={Boolean(message("content"))} className="admin-input min-h-56 resize-y" name="content" required value={form.content} onChange={change} />{message("content") && <small className="mt-1 block text-rose-700" role="alert">{message("content")}</small>}</label>
        </section>
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div><h2 className="text-lg font-semibold text-slate-950">Xuất bản</h2><p className="mt-1 text-sm text-slate-500">Đường dẫn và trạng thái hiển thị.</p></div>
          <div><label className="admin-label" htmlFor="post-slug">Đường dẫn (slug)</label><input aria-invalid={Boolean(message("slug"))} className="admin-input" id="post-slug" maxLength={200} name="slug" required value={form.slug} onChange={change} /><button className="mt-2 text-xs font-semibold text-indigo-700 hover:underline" onClick={() => { setForm((current) => ({ ...current, slug: slugify(current.title) })); setManualSlug(false); }} type="button">Tạo lại từ tiêu đề</button>{message("slug") && <small className="mt-1 block text-rose-700" role="alert">{message("slug")}</small>}</div>
          <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700"><input checked={form.status} className="size-4 accent-indigo-700" name="status" onChange={change} type="checkbox" /> Hiển thị bài viết</label>
        </section>
      </div>
      <div className="flex flex-wrap justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:px-6"><Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700" href="/admin/posts">Hủy</Link><button className="min-h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50" disabled={submitting} type="submit">{submitting ? "Đang lưu…" : initialData?.id ? "Lưu thay đổi" : "Thêm bài viết"}</button></div>
    </form>
  );
}
