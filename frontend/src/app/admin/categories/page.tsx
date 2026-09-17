"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useConfirm } from "@/contexts/ConfirmContext";
import { ApiError, apiDelete, apiGetList, apiPatch, apiPost } from "@/lib/api";

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  status: string;
  sort_order?: number;
  products_count?: number;
};

const emptyForm = { id: 0, name: "", slug: "", status: "active", sort_order: "0" };

export default function AdminCategoriesPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    apiGetList<CategoryRow>("/admin/categories")
      .then(setCategories)
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
      ...form,
      id: undefined,
      sort_order: Number(form.sort_order),
      slug: form.slug || undefined,
    };

    if (form.id) {
      await apiPatch(`/admin/categories/${form.id}`, payload);
      setMessage("Da cap nhat danh muc.");
    } else {
      await apiPost("/admin/categories", payload);
      setMessage("Da tao danh muc.");
    }

    setForm(emptyForm);
    load();
  }

  async function remove(category: CategoryRow) {
    setMessage("");
    const accepted = await confirm({
      title: "Xoa danh muc?",
      message: `Ban chac chan muon xoa danh muc "${category.name}"?`,
      confirmLabel: "Xoa",
    });

    if (!accepted) {
      return;
    }

    try {
      await apiDelete(`/admin/categories/${category.id}`);
      setMessage("Da xoa danh muc.");
      load();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Khong the xoa danh muc.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Quan ly danh muc</h1>
      <form onSubmit={submit} className="mt-6 grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
        <input required placeholder="Ten danh muc" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3" />
        <input placeholder="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3" />
        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <input type="number" placeholder="Thu tu" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3" />
        <div className="flex gap-2">
          <button className="rounded-md bg-slate-950 px-4 text-sm font-semibold text-white">{form.id ? "Cap nhat" : "Tao"}</button>
          {form.id ? (
            <button type="button" onClick={() => setForm(emptyForm)} className="rounded-md border border-slate-300 px-4 text-sm font-semibold">
              Huy
            </button>
          ) : null}
        </div>
      </form>
      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}
      <div className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-3">Ten</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Status</th>
              <th className="p-3">San pham</th>
              <th className="p-3">Thao tac</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-t border-slate-200">
                <td className="p-3 font-semibold">{category.name}</td>
                <td className="p-3">{category.slug}</td>
                <td className="p-3">{category.status}</td>
                <td className="p-3">{category.products_count ?? 0}</td>
                <td className="flex gap-2 p-3">
                  <button type="button" onClick={() => setForm({ id: category.id, name: category.name, slug: category.slug, status: category.status, sort_order: String(category.sort_order ?? 0) })} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
                    Sua
                  </button>
                  <button type="button" disabled={(category.products_count ?? 0) > 0} onClick={() => remove(category)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
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
