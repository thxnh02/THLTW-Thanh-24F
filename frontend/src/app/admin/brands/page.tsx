"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/contexts/ConfirmContext";
import { ApiError, apiDelete, apiGetList } from "@/lib/api";
type Row = { id: number; name: string; slug: string; status: string; products_count?: number };
export default function BrandsPage() {
  const router = useRouter(); const confirm = useConfirm(); const [rows, setRows] = useState<Row[]>([]); const [message, setMessage] = useState("");
  const load = useCallback(() => apiGetList<Row>("/admin/brands").then(setRows).catch((reason: Error) => { if (reason instanceof ApiError && reason.status === 401) router.push("/admin/login"); else setMessage(reason.message); }), [router]);
  useEffect(() => { void load(); }, [load]);
  async function remove(row: Row) { if (!(await confirm({ title: "Xoa thuong hieu?", message: `Xoa ${row.name}?`, confirmLabel: "Xoa" }))) return; try { await apiDelete(`/admin/brands/${row.id}`); void load(); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Khong the xoa."); } }
  return <main className="mx-auto max-w-7xl px-4 py-8"><div className="mb-6 flex items-center justify-between"><div><h1 className="text-3xl font-bold text-slate-950">Thuong hieu</h1><p className="mt-1 text-sm text-slate-500">Quan ly thuong hieu san pham.</p></div><Link href="/admin/brands/create" className="rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Them thuong hieu</Link></div>{message ? <p className="mb-3 text-sm text-rose-700">{message}</p> : null}<div className="overflow-hidden rounded-md border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Ten</th><th className="p-3">Slug</th><th className="p-3">Trang thai</th><th className="p-3">San pham</th><th className="p-3">Thao tac</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-slate-200"><td className="p-3 font-semibold">{row.name}</td><td className="p-3">{row.slug}</td><td className="p-3">{row.status === "active" ? "Dang hoat dong" : "Da tat"}</td><td className="p-3">{row.products_count ?? 0}</td><td className="flex gap-2 p-3"><Link href={`/admin/brands/${row.id}/edit`} className="rounded-md border border-slate-300 px-3 py-2 font-semibold">Sua</Link><button type="button" disabled={(row.products_count ?? 0) > 0} onClick={() => void remove(row)} className="rounded-md border border-slate-300 px-3 py-2 font-semibold disabled:opacity-40">Xoa</button></td></tr>)}</tbody></table></div></main>;
}
