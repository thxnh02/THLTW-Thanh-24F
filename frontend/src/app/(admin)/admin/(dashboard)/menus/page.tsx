"use client";

import Link from "next/link";
import { useConfirm } from "@/contexts/ConfirmContext";
import { Pagination } from "@/components/admin/shared/Pagination";
import { usePaginatedAdminRows } from "@/hooks/admin/usePaginatedAdminRows";
import { apiDeleteResponse } from "@/lib/api";
import type { Menu } from "@/types/api";

export default function MenusPage() {
  const confirm = useConfirm(); const { rows, meta, message, setMessage, router } = usePaginatedAdminRows<Menu>("/admin/menus");
  async function remove(row: Menu) { if (!(await confirm({ title: "Xóa menu?", message: `Xóa ${row.label}?`, confirmLabel: "Xóa" }))) return; try { const response = await apiDeleteResponse<null>(`/admin/menus/${row.id}`); setMessage(response.message); router.refresh(); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Không thể xử lý menu."); } }
  return <main className="mx-auto max-w-7xl px-4 py-8"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold text-slate-950">Menu</h1><p className="mt-1 text-sm text-slate-500">Sắp xếp điều hướng của cửa hàng.</p></div><Link href="/admin/menus/create" className="rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Thêm menu</Link></div>{message ? <p className="mb-3 text-sm text-rose-700">{message}</p> : null}<div className="overflow-x-auto rounded-md border border-slate-200 bg-white"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Nhãn</th><th className="p-3">URL</th><th className="p-3">Loại</th><th className="p-3">Thứ tự</th><th className="p-3">Thao tác</th></tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.id} className="border-t border-slate-200"><td className="p-3 font-semibold">{row.label}</td><td className="p-3">{row.url}</td><td className="p-3">{row.type}</td><td className="p-3">{row.sort_order}</td><td className="flex gap-2 p-3"><Link href={`/admin/menus/${row.id}/edit`} className="rounded-md border border-slate-300 px-3 py-2 font-semibold">Sửa</Link><button type="button" onClick={() => void remove(row)} className="rounded-md border border-slate-300 px-3 py-2 font-semibold">Xóa</button></td></tr>) : <tr><td colSpan={5} className="p-8 text-center text-slate-500">Chưa có menu.</td></tr>}</tbody></table><Pagination meta={meta} /></div></main>;
}
