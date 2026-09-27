"use client";

import Link from "next/link";
import { useConfirm } from "@/contexts/ConfirmContext";
import { Pagination } from "@/components/admin/Pagination";
import { usePaginatedAdminRows } from "@/hooks/usePaginatedAdminRows";
import { apiDeleteResponse } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { ShippingMethod } from "@/types/api";

export default function ShippingMethodsPage() {
  const confirm = useConfirm(); const { rows, meta, message, setMessage, router } = usePaginatedAdminRows<ShippingMethod>("/admin/shipping-methods");
  async function remove(row: ShippingMethod) { if (!(await confirm({ title: "Xóa phương thức?", message: `Xóa ${row.name}?`, confirmLabel: "Xóa" }))) return; try { const response = await apiDeleteResponse<null>(`/admin/shipping-methods/${row.id}`); setMessage(response.message); router.refresh(); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Không thể xử lý phương thức giao hàng."); } }
  return <main className="mx-auto max-w-7xl px-4 py-8"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold text-slate-950">Phương thức giao hàng</h1><p className="mt-1 text-sm text-slate-500">Cấu hình phí và thời gian giao hàng.</p></div><Link href="/admin/shipping-methods/create" className="rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Thêm phương thức</Link></div>{message ? <p className="mb-3 text-sm text-rose-700">{message}</p> : null}<div className="overflow-x-auto rounded-md border border-slate-200 bg-white"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Tên</th><th className="p-3">Mã</th><th className="p-3">Phí</th><th className="p-3">Trạng thái</th><th className="p-3">Thao tác</th></tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.id} className="border-t border-slate-200"><td className="p-3 font-semibold">{row.name}</td><td className="p-3">{row.code}</td><td className="p-3">{formatVnd(row.fee)}</td><td className="p-3">{row.active ? "Đang hoạt động" : "Đã tắt"}</td><td className="flex gap-2 p-3"><Link href={`/admin/shipping-methods/${row.id}/edit`} className="rounded-md border border-slate-300 px-3 py-2 font-semibold">Sửa</Link><button type="button" onClick={() => void remove(row)} className="rounded-md border border-slate-300 px-3 py-2 font-semibold">Xóa</button></td></tr>) : <tr><td colSpan={5} className="p-8 text-center text-slate-500">Chưa có phương thức giao hàng.</td></tr>}</tbody></table><Pagination meta={meta} /></div></main>;
}
