"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { Pagination } from "@/components/admin/shared/Pagination";
import { Badge, Button, Input, PageHeader, Select } from "@/components/ui";
import { useConfirm } from "@/contexts/ConfirmContext";
import { API_BASE_URL, ApiError, apiDeleteResponse, apiGetList, apiGetPaginated } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { Brand, Category, PaginatedMeta, Product } from "@/types/api";

const emptyMeta: PaginatedMeta = { current_page: 1, last_page: 1, total: 0 };

export default function ProductsPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const params = useSearchParams();
  const queryString = params.toString();
  const [rows, setRows] = useState<Product[]>([]);
  const [meta, setMeta] = useState(emptyMeta);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState(params.get("q") ?? "");

  useEffect(() => { void Promise.all([apiGetList<Category>("/admin/categories"), apiGetList<Brand>("/admin/brands")]).then(([nextCategories, nextBrands]) => { setCategories(nextCategories); setBrands(nextBrands); }); }, []);
  useEffect(() => { void apiGetPaginated<Product>(`/admin/products${queryString ? `?${queryString}` : ""}`).then(({ data, meta: nextMeta }) => { setRows(data); setMeta(nextMeta); }).catch((reason: Error) => { if (reason instanceof ApiError && reason.status === 401) router.push("/admin/login"); else setMessage(reason.message); }); }, [queryString, router]);

  function search(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const next = new URLSearchParams(queryString); if (query) next.set("q", query); else next.delete("q"); next.delete("page"); router.push(`/admin/products?${next.toString()}`); }
  function filter(key: string, value: string) { const next = new URLSearchParams(queryString); if (value) next.set(key, value); else next.delete(key); next.delete("page"); router.push(`/admin/products?${next.toString()}`); }
  async function remove(row: Product) { if (!(await confirm({ title: "Xóa sản phẩm?", message: `Xóa hoặc ẩn ${row.name}?`, confirmLabel: "Xóa" }))) return; try { const response = await apiDeleteResponse<null>(`/admin/products/${row.id}`); setMessage(response.message); router.refresh(); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Không thể xử lý sản phẩm."); } }

  return <main className="mx-auto max-w-7xl px-4 py-8"><PageHeader eyebrow="Danh mục hàng hóa" title="Sản phẩm" description="Quản lý thông tin, biến thể, ảnh và tồn kho." action={<div className="flex gap-2"><a href={`${API_BASE_URL}/admin/products/export`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3.5 text-sm font-semibold text-slate-800 hover:border-teal-600 hover:text-teal-800"><Download size={16} aria-hidden="true" />Xuất CSV</a><Link href="/admin/products/create"><Button><Plus size={17} aria-hidden="true" />Thêm sản phẩm</Button></Link></div>} /><section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)]"><form onSubmit={search} className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_180px_180px_auto]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên hoặc mã sản phẩm" className="pl-9" /></div><Select aria-label="Lọc trạng thái" value={params.get("status") ?? ""} onChange={(event) => filter("status", event.target.value)}><option value="">Tất cả trạng thái</option><option value="active">Đang bán</option><option value="inactive">Đã tắt</option><option value="draft">Bản nháp</option></Select><Select aria-label="Lọc danh mục" value={params.get("category") ?? ""} onChange={(event) => filter("category", event.target.value)}><option value="">Tất cả danh mục</option>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</Select><Select aria-label="Lọc thương hiệu" value={params.get("brand") ?? ""} onChange={(event) => filter("brand", event.target.value)}><option value="">Tất cả thương hiệu</option>{brands.map((brand) => <option key={brand.id} value={brand.slug}>{brand.name}</option>)}</Select><Button type="submit"><Search size={16} aria-hidden="true" />Tìm</Button></form>{message ? <p role="status" className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">{message}</p> : null}<div className="mt-5 overflow-x-auto border-t border-[var(--border)]"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-3 py-3 font-semibold">Sản phẩm</th><th className="px-3 py-3 font-semibold">Danh mục</th><th className="px-3 py-3 font-semibold">Giá</th><th className="px-3 py-3 font-semibold">Tồn kho</th><th className="px-3 py-3 font-semibold">Trạng thái</th><th className="px-3 py-3 font-semibold text-right">Thao tác</th></tr></thead><tbody>{rows.length ? rows.map((row) => { const variant = row.default_variant ?? row.variants?.[0]; return <tr key={row.id} className="border-t border-[var(--border)]"><td className="px-3 py-3"><Link href={`/admin/products/${row.id}`} className="font-semibold text-slate-950 hover:text-teal-800 hover:underline">{row.name}</Link><span className="mt-1 block text-xs text-slate-500">{variant?.sku ?? "-"}</span></td><td className="px-3 py-3 text-slate-600">{row.category?.name ?? "-"}</td><td className="px-3 py-3 font-semibold">{formatVnd(variant?.sale_price ?? variant?.price)}</td><td className="px-3 py-3">{variant?.stock_quantity ?? row.stock_quantity ?? 0}</td><td className="px-3 py-3"><StatusBadge status={row.status} /></td><td className="px-3 py-3"><div className="flex justify-end gap-1.5"><Link href={`/admin/products/${row.id}/edit`} className="inline-flex size-9 items-center justify-center rounded-md border border-[var(--border)] text-slate-700 hover:border-teal-600 hover:text-teal-800" title="Sửa sản phẩm" aria-label={`Sửa ${row.name}`}><Pencil size={16} aria-hidden="true" /></Link><button type="button" onClick={() => void remove(row)} className="inline-flex size-9 items-center justify-center rounded-md border border-[var(--border)] text-red-700 hover:border-red-400 hover:bg-red-50" title="Xóa sản phẩm" aria-label={`Xóa ${row.name}`}><Trash2 size={16} aria-hidden="true" /></button></div></td></tr>; }) : <tr><td colSpan={6} className="p-10 text-center text-sm text-slate-500">Không có sản phẩm phù hợp.</td></tr>}</tbody></table></div><Pagination meta={meta} /></section></main>;
}

function StatusBadge({ status }: { status?: string }) { const tone = status === "active" ? "success" : status === "draft" ? "warning" : "neutral"; const label = status === "active" ? "Đang bán" : status === "draft" ? "Bản nháp" : "Đã tắt"; return <Badge tone={tone}>{label}</Badge>; }
