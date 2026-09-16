"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useConfirm } from "@/contexts/ConfirmContext";
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Page } from "@/types/api";

type PageForm = { id?: number; title: string; slug: string; content: string; status: Page["status"]; seo_title: string; seo_description: string };

const emptyForm: PageForm = { title: "", slug: "", content: "", status: "draft", seo_title: "", seo_description: "" };

export default function AdminPagesPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [pages, setPages] = useState<Page[]>([]);
  const [form, setForm] = useState<PageForm>(emptyForm);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    apiGet<{ data: Page[] }>("/admin/pages")
      .then((payload) => setPages(payload.data ?? []))
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/admin/login");
          return;
        }
        setMessage(reason.message);
      });
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      title: form.title,
      slug: form.slug || undefined,
      content: form.content,
      status: form.status,
      seo_title: form.seo_title || undefined,
      seo_description: form.seo_description || undefined,
    };
    if (form.id) {
      await apiPatch(`/admin/pages/${form.id}`, payload);
      setMessage("Da cap nhat trang.");
    } else {
      await apiPost("/admin/pages", payload);
      setMessage("Da tao trang.");
    }
    setForm(emptyForm);
    load();
  }

  async function remove(page: Page) {
    const accepted = await confirm({
      title: "Xoa trang?",
      message: `Ban chac chan muon xoa trang "${page.title}"?`,
      confirmLabel: "Xoa",
    });

    if (!accepted) {
      return;
    }

    await apiDelete(`/admin/pages/${page.id}`);
    setMessage("Da xoa trang.");
    load();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Trang tinh</h1>
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-3">
        <Input label="Tieu de" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
        <Input label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} />
        <label className="block text-sm font-semibold text-slate-700">
          Status
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Page["status"] })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <Input label="SEO title" value={form.seo_title} onChange={(value) => setForm({ ...form, seo_title: value })} />
        <Input label="SEO description" value={form.seo_description} onChange={(value) => setForm({ ...form, seo_description: value })} />
        <label className="block text-sm font-semibold text-slate-700 lg:col-span-3">
          Noi dung
          <textarea required value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} className="mt-1 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 font-normal" />
        </label>
        <button className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white lg:col-span-3">{form.id ? "Cap nhat" : "Tao trang"}</button>
      </form>
      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}
      <div className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-3">Tieu de</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Status</th>
              <th className="p-3">Thao tac</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id} className="border-t border-slate-200">
                <td className="p-3 font-semibold">{page.title}</td>
                <td className="p-3">{page.slug}</td>
                <td className="p-3">{page.status}</td>
                <td className="flex gap-2 p-3">
                  <button type="button" onClick={() => setForm({ id: page.id, title: page.title, slug: page.slug, content: page.content, status: page.status, seo_title: page.seo_title ?? "", seo_description: page.seo_description ?? "" })} className="rounded-md border border-slate-300 px-3 py-2 font-semibold">
                    Sua
                  </button>
                  <button type="button" onClick={() => remove(page)} className="rounded-md border border-slate-300 px-3 py-2 font-semibold">
                    Xoa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Input({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" />
    </label>
  );
}
