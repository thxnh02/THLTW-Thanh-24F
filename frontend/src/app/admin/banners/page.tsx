"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminImageUpload } from "@/components/AdminImageUpload";
import { useConfirm } from "@/contexts/ConfirmContext";
import { ApiError, apiDelete, apiGetList, apiPatch, apiPost } from "@/lib/api";
import type { Banner } from "@/types/api";

type BannerForm = { id?: number; title: string; image: string; link: string; sort_order: string; active: boolean };
const emptyForm: BannerForm = { title: "", image: "/hero-ecommerce.svg", link: "/products", sort_order: "0", active: true };

export default function AdminBannersPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    apiGetList<Banner>("/admin/banners")
      .then(setBanners)
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
    const payload = { title: form.title, image: form.image, link: form.link || undefined, sort_order: Number(form.sort_order), active: form.active };
    if (form.id) {
      await apiPatch(`/admin/banners/${form.id}`, payload);
      setMessage("Da cap nhat banner.");
    } else {
      await apiPost("/admin/banners", payload);
      setMessage("Da tao banner.");
    }
    setForm(emptyForm);
    load();
  }

  async function remove(banner: Banner) {
    const accepted = await confirm({
      title: "Xoa banner?",
      message: `Ban chac chan muon xoa banner "${banner.title}"?`,
      confirmLabel: "Xoa",
    });

    if (!accepted) {
      return;
    }

    await apiDelete(`/admin/banners/${banner.id}`);
    setMessage("Da xoa banner.");
    load();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Quan ly banner</h1>
      <form onSubmit={submit} className="mt-6 grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
        <input required placeholder="Tieu de" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3" />
        <div className="grid gap-2">
          <input required placeholder="Anh" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3" />
          <AdminImageUpload value={form.image} directory="banners" onChange={(value) => setForm({ ...form, image: value })} />
        </div>
        <input placeholder="Link" value={form.link} onChange={(event) => setForm({ ...form, link: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3" />
        <input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3" />
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
          Active
        </label>
        <button className="rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white md:col-span-5">{form.id ? "Cap nhat" : "Tao banner"}</button>
      </form>
      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}
      <Table items={banners} onEdit={(banner) => setForm({ id: banner.id, title: banner.title, image: banner.image, link: banner.link ?? "", sort_order: String(banner.sort_order), active: banner.active })} onDelete={remove} />
    </main>
  );
}

function Table({ items, onEdit, onDelete }: { items: Banner[]; onEdit: (banner: Banner) => void; onDelete: (banner: Banner) => void }) {
  return (
    <div className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th className="p-3">Tieu de</th>
            <th className="p-3">Anh</th>
            <th className="p-3">Active</th>
            <th className="p-3">Thao tac</th>
          </tr>
        </thead>
        <tbody>
          {items.map((banner) => (
            <tr key={banner.id} className="border-t border-slate-200">
              <td className="p-3 font-semibold">{banner.title}</td>
              <td className="p-3">{banner.image}</td>
              <td className="p-3">{banner.active ? "yes" : "no"}</td>
              <td className="flex gap-2 p-3">
                <button type="button" onClick={() => onEdit(banner)} className="rounded-md border border-slate-300 px-3 py-2 font-semibold">Sua</button>
                <button type="button" onClick={() => onDelete(banner)} className="rounded-md border border-slate-300 px-3 py-2 font-semibold">Xoa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
