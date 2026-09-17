"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useConfirm } from "@/contexts/ConfirmContext";
import { ApiError, apiDelete, apiGetList, apiPatch, apiPost } from "@/lib/api";
import type { Menu } from "@/types/api";

type MenuForm = { id?: number; parent_id: string; label: string; url: string; type: Menu["type"]; sort_order: string; active: boolean };
const emptyForm: MenuForm = { parent_id: "", label: "", url: "/", type: "custom", sort_order: "0", active: true };

export default function AdminMenusPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [form, setForm] = useState<MenuForm>(emptyForm);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    apiGetList<Menu>("/admin/menus")
      .then(setMenus)
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
      parent_id: form.parent_id ? Number(form.parent_id) : undefined,
      label: form.label,
      url: form.url,
      type: form.type,
      sort_order: Number(form.sort_order),
      active: form.active,
    };
    if (form.id) {
      await apiPatch(`/admin/menus/${form.id}`, payload);
      setMessage("Da cap nhat menu.");
    } else {
      await apiPost("/admin/menus", payload);
      setMessage("Da tao menu.");
    }
    setForm(emptyForm);
    load();
  }

  async function remove(menu: Menu) {
    const accepted = await confirm({
      title: "Xoa menu?",
      message: `Ban chac chan muon xoa menu "${menu.label}"?`,
      confirmLabel: "Xoa",
    });

    if (!accepted) {
      return;
    }

    try {
      await apiDelete(`/admin/menus/${menu.id}`);
      setMessage("Da xoa menu.");
      load();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Khong the xoa menu.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Menu</h1>
      <form onSubmit={submit} className="mt-6 grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-6">
        <input required placeholder="Label" value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3" />
        <input required placeholder="URL" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3" />
        <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as Menu["type"] })} className="h-10 rounded-md border border-slate-300 px-3">
          <option value="custom">Custom</option>
          <option value="page">Page</option>
          <option value="category">Category</option>
          <option value="post">Post</option>
        </select>
        <select value={form.parent_id} onChange={(event) => setForm({ ...form, parent_id: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3">
          <option value="">Khong co menu cha</option>
          {menus.filter((menu) => menu.id !== form.id).map((menu) => (
            <option key={menu.id} value={menu.id}>{menu.label}</option>
          ))}
        </select>
        <input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3" />
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
          Active
        </label>
        <button className="rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white md:col-span-6">{form.id ? "Cap nhat" : "Tao menu"}</button>
      </form>
      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}
      <div className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr><th className="p-3">Label</th><th className="p-3">URL</th><th className="p-3">Type</th><th className="p-3">Active</th><th className="p-3">Thao tac</th></tr>
          </thead>
          <tbody>
            {menus.map((menu) => (
              <tr key={menu.id} className="border-t border-slate-200">
                <td className="p-3 font-semibold">{menu.label}</td>
                <td className="p-3">{menu.url}</td>
                <td className="p-3">{menu.type}</td>
                <td className="p-3">{menu.active ? "yes" : "no"}</td>
                <td className="flex gap-2 p-3">
                  <button type="button" onClick={() => setForm({ id: menu.id, parent_id: menu.parent_id ? String(menu.parent_id) : "", label: menu.label, url: menu.url, type: menu.type, sort_order: String(menu.sort_order), active: menu.active })} className="rounded-md border border-slate-300 px-3 py-2 font-semibold">Sua</button>
                  <button type="button" onClick={() => remove(menu)} className="rounded-md border border-slate-300 px-3 py-2 font-semibold">Xoa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
