"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useConfirm } from "@/contexts/ConfirmContext";
import { ApiError, apiDelete, apiGetList, apiPatch, apiPost } from "@/lib/api";
import type { PostCategory } from "@/types/api";

const emptyForm = { id: 0, name: "", slug: "", status: "active" as PostCategory["status"] };

export default function AdminPostCategoriesPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [items, setItems] = useState<PostCategory[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    apiGetList<PostCategory>("/admin/post-categories")
      .then(setItems)
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
    const payload = { name: form.name, slug: form.slug || undefined, status: form.status };
    if (form.id) {
      await apiPatch(`/admin/post-categories/${form.id}`, payload);
      setMessage("Da cap nhat chu de.");
    } else {
      await apiPost("/admin/post-categories", payload);
      setMessage("Da tao chu de.");
    }
    setForm(emptyForm);
    load();
  }

  async function remove(item: PostCategory) {
    const accepted = await confirm({
      title: "Xoa chu de?",
      message: `Ban chac chan muon xoa chu de "${item.name}"?`,
      confirmLabel: "Xoa",
    });

    if (!accepted) {
      return;
    }

    try {
      await apiDelete(`/admin/post-categories/${item.id}`);
      setMessage("Da xoa chu de.");
      load();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Khong the xoa chu de.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Chu de bai viet</h1>
      <form onSubmit={submit} className="mt-6 grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <input required placeholder="Ten chu de" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3" />
        <input placeholder="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3" />
        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PostCategory["status"] })} className="h-10 rounded-md border border-slate-300 px-3">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="rounded-md bg-slate-950 px-4 text-sm font-semibold text-white">{form.id ? "Cap nhat" : "Tao"}</button>
      </form>
      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}
      <div className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-3">Ten</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Status</th>
              <th className="p-3">Bai viet</th>
              <th className="p-3">Thao tac</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-200">
                <td className="p-3 font-semibold">{item.name}</td>
                <td className="p-3">{item.slug}</td>
                <td className="p-3">{item.status}</td>
                <td className="p-3">{item.posts_count ?? 0}</td>
                <td className="flex gap-2 p-3">
                  <button type="button" onClick={() => setForm({ id: item.id, name: item.name, slug: item.slug, status: item.status })} className="rounded-md border border-slate-300 px-3 py-2 font-semibold">
                    Sua
                  </button>
                  <button type="button" disabled={(item.posts_count ?? 0) > 0} onClick={() => remove(item)} className="rounded-md border border-slate-300 px-3 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50">
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
