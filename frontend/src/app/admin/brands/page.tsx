"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useConfirm } from "@/contexts/ConfirmContext";
import { ApiError, apiDelete, apiGetList, apiPost } from "@/lib/api";

type BrandRow = {
  id: number;
  name: string;
  slug: string;
  status: string;
  products_count?: number;
};

export default function AdminBrandsPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [form, setForm] = useState({ name: "", slug: "", status: "active" });
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    apiGetList<BrandRow>("/admin/brands")
      .then(setBrands)
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
    await apiPost("/admin/brands", {
      ...form,
      slug: form.slug || undefined,
    });
    setMessage("Da tao thuong hieu.");
    setForm({ name: "", slug: "", status: "active" });
    load();
  }

  async function remove(brand: BrandRow) {
    setMessage("");
    const accepted = await confirm({
      title: "Xoa thuong hieu?",
      message: `Ban chac chan muon xoa thuong hieu "${brand.name}"?`,
      confirmLabel: "Xoa",
    });

    if (!accepted) {
      return;
    }

    try {
      await apiDelete(`/admin/brands/${brand.id}`);
      setMessage("Da xoa thuong hieu.");
      load();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Khong the xoa thuong hieu.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Quan ly thuong hieu</h1>
      <form onSubmit={submit} className="mt-6 grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <input
          required
          placeholder="Ten thuong hieu"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="h-10 rounded-md border border-slate-300 px-3"
        />
        <input
          placeholder="Slug"
          value={form.slug}
          onChange={(event) => setForm({ ...form, slug: event.target.value })}
          className="h-10 rounded-md border border-slate-300 px-3"
        />
        <select
          value={form.status}
          onChange={(event) => setForm({ ...form, status: event.target.value })}
          className="h-10 rounded-md border border-slate-300 px-3"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="rounded-md bg-slate-950 px-4 text-sm font-semibold text-white">Tao</button>
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
            {brands.map((brand) => (
              <tr key={brand.id} className="border-t border-slate-200">
                <td className="p-3 font-semibold">{brand.name}</td>
                <td className="p-3">{brand.slug}</td>
                <td className="p-3">{brand.status}</td>
                <td className="p-3">{brand.products_count ?? 0}</td>
                <td className="p-3">
                  <button
                    type="button"
                    disabled={(brand.products_count ?? 0) > 0}
                    onClick={() => remove(brand)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
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
