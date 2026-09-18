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
      setMessage("Đã cập nhật menu.");
    } else {
      await apiPost("/admin/menus", payload);
      setMessage("Đã tạo menu.");
    }
    setForm(emptyForm);
    load();
  }

  async function remove(menu: Menu) {
    const accepted = await confirm({
      title: "Xóa menu?",
      message: `Bạn chắc chắn muốn xóa menu "${menu.label}"?`,
      confirmLabel: "Xoa",
    });

    if (!accepted) {
      return;
    }

    try {
      await apiDelete(`/admin/menus/${menu.id}`);
      setMessage("Đã xóa menu.");
      load();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Không thể xóa menu.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Menu</h1>
      <form onSubmit={submit} className="mt-6 grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-6">
        <input required placeholder="Nhãn menu" value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3" />
        <input required placeholder="URL" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3" />
        <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as Menu["type"] })} className="h-10 rounded-md border border-slate-300 px-3">
          <option value="custom">Tùy chỉnh</option>
          <option value="page">Trang</option>
          <option value="category">Danh mục</option>
          <option value="post">Bài viết</option>
        </select>
        <select value={form.parent_id} onChange={(event) => setForm({ ...form, parent_id: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3">
          <option value="">Không có menu cha</option>
          {menus.filter((menu) => menu.id !== form.id).map((menu) => (
            <option key={menu.id} value={menu.id}>{menu.label}</option>
          ))}
        </select>
        <input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3" />
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
          Active
        </label>
        <button className="rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white md:col-span-6">{form.id ? "Cập nhật" : "Tạo menu"}</button>
      </form>
      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}
      <div className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr><th className="p-3">Nhãn</th><th className="p-3">URL</th><th className="p-3">Loại</th><th className="p-3">Trạng thái</th><th className="p-3">Thao tác</th></tr>
          </thead>
          <tbody>
            {menus.map((menu) => (
              <tr key={menu.id} className="border-t border-slate-200">
                <td className="p-3 font-semibold">{menu.label}</td>
                <td className="p-3">{menu.url}</td>
                <td className="p-3">{menu.type === "custom" ? "Tùy chỉnh" : menu.type === "page" ? "Trang" : menu.type === "category" ? "Danh mục" : "Bài viết"}</td>
                <td className="p-3">{menu.active ? "Đang hoạt động" : "Đã tắt"}</td>
                <td className="flex gap-2 p-3">
                  <button type="button" onClick={() => setForm({ id: menu.id, parent_id: menu.parent_id ? String(menu.parent_id) : "", label: menu.label, url: menu.url, type: menu.type, sort_order: String(menu.sort_order), active: menu.active })} className="rounded-md border border-slate-300 px-3 py-2 font-semibold">Sửa</button>
                  <button type="button" onClick={() => void remove(menu)} className="rounded-md border border-slate-300 px-3 py-2 font-semibold">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
