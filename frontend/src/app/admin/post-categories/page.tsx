"use client";

import Link from "next/link";
import { useConfirm } from "@/contexts/ConfirmContext";
import { Pagination } from "@/components/admin/Pagination";
import { usePaginatedAdminRows } from "@/hooks/usePaginatedAdminRows";
import { apiDeleteResponse } from "@/lib/api";
import type { PostCategory } from "@/types/api";

export default function PostCategoriesPage() {
  const confirm = useConfirm(); const { rows, meta, message, setMessage, router } = usePaginatedAdminRows<PostCategory>("/admin/post-categories");
  async function remove(row: PostCategory) { if (!(await confirm({ title: "Xóa chuyên mục?", message: `Xóa ${row.name}?`, confirmLabel: "Xóa" }))) return; try { const response = await apiDeleteResponse<null>(`/admin/post-categories/${row.id}`); setMessage(response.message); router.refresh(); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Không thể xử lý chuyên mục."); } }
  return <main className="mx-auto max-w-7xl px-4 py-8"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold text-slate-950">Chuyên mục bài viết</h1><p className="mt-1 text-sm text-slate-500">Phân loại nội dung của cửa hàng.</p></div><Link href="/admin/post-categories/create" className="rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Thêm chuyên mục</Link></div>{message ? <p className="mb-3 text-sm text-rose-700">{message}</p> : null}<div className="overflow-x-auto rounded-md border border-slate-200 bg-white"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Tên</th><th className="p-3">Slug</th><th className="p-3">Trạng thái</th><th className="p-3">Bài viết</th><th className="p-3">Thao tác</th></tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.id} className="border-t border-slate-200"><td className="p-3 font-semibold">{row.name}</td><td className="p-3">{row.slug}</td><td className="p-3">{row.status === "active" ? "Đang hoạt động" : "Đã tắt"}</td><td className="p-3">{row.posts_count ?? 0}</td><td className="flex gap-2 p-3"><Link href={`/admin/post-categories/${row.id}/edit`} className="rounded-md border border-slate-300 px-3 py-2 font-semibold">Sửa</Link><button type="button" disabled={(row.posts_count ?? 0) > 0} onClick={() => void remove(row)} className="rounded-md border border-slate-300 px-3 py-2 font-semibold disabled:opacity-40">Xóa</button></td></tr>) : <tr><td colSpan={5} className="p-8 text-center text-slate-500">Chưa có chuyên mục.</td></tr>}</tbody></table><Pagination meta={meta} /></div></main>;
}
