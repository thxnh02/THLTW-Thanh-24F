"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Pagination } from "@/components/admin/shared/Pagination";
import { AdminTable } from "@/components/admin/table/AdminTable";
import { Badge, Button, EmptyState, ErrorState, Input, PageHeader, Skeleton } from "@/components/ui";
import { useConfirm } from "@/context/ConfirmContext";
import { ApiError } from "@/lib/apiError";
import { categoryAdminService } from "@/services/admin/categoryAdminService";
import type { Category, PaginatedMeta } from "@/types/api";

const emptyMeta: PaginatedMeta = { current_page: 1, last_page: 1, total: 0 };

export default function CategoriesPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const params = useSearchParams();
  const queryString = params.toString();
  const [rows, setRows] = useState<Category[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>(emptyMeta);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await categoryAdminService.getCategories(queryString);
      setRows(response.data);
      setMeta(response.meta);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) router.push("/admin/login");
      else setError(reason instanceof Error ? reason.message : "Không thể tải danh mục.");
    } finally {
      setLoading(false);
    }
  }, [queryString, router]);

  useEffect(() => { void Promise.resolve().then(loadCategories); }, [loadCategories]);

  function navigate(next: URLSearchParams) {
    router.push(`/admin/categories${next.toString() ? `?${next.toString()}` : ""}`);
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams(queryString);
    if (query.trim()) next.set("q", query.trim()); else next.delete("q");
    next.delete("page");
    navigate(next);
  }

  function filterStatus(status: string) {
    const next = new URLSearchParams(queryString);
    if (status) next.set("status", status); else next.delete("status");
    next.delete("page");
    navigate(next);
  }

  async function remove(category: Category) {
    if (!(await confirm({ title: "Xóa danh mục?", message: `Xóa ${category.name}?`, confirmLabel: "Xóa" }))) return;
    setMessage("");
    try {
      await categoryAdminService.deleteCategory(category.id);
      const currentPage = meta.current_page ?? 1;
      if (rows.length === 1 && currentPage > 1) {
        const next = new URLSearchParams(queryString);
        next.set("page", String(currentPage - 1));
        navigate(next);
      } else {
        await loadCategories();
      }
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Không thể xóa danh mục.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader eyebrow="Danh mục hàng hóa" title="Danh mục" description="Tạo, cập nhật và sắp xếp danh mục sản phẩm theo dữ liệu từ hệ thống." action={<Link href="/admin/categories/create"><Button>Thêm danh mục</Button></Link>} />
      <form onSubmit={search} className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_180px_auto]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm danh mục" aria-label="Tìm danh mục" />
        <select value={params.get("status") ?? ""} onChange={(event) => filterStatus(event.target.value)} aria-label="Lọc trạng thái" className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="">Tất cả trạng thái</option><option value="active">Đang hoạt động</option><option value="inactive">Đã tắt</option></select>
        <Button type="submit">Tìm kiếm</Button>
      </form>
      {message ? <p role="alert" className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-800">{message}</p> : null}
      {error ? <ErrorState message={error} onRetry={() => void loadCategories()} /> : null}
      {loading ? <CategoryTableSkeleton /> : null}
      {!loading && !error && rows.length === 0 ? <EmptyState title="Chưa có danh mục" message="Hãy tạo danh mục đầu tiên để nhóm các sản phẩm trong cửa hàng." action={<Link href="/admin/categories/create"><Button>Thêm danh mục</Button></Link>} /> : null}
      {!loading && !error && rows.length > 0 ? <><AdminTable minWidth="800px"><thead className="bg-slate-50 text-slate-600"><tr><th scope="col" className="px-3 py-3 font-semibold">Ảnh</th><th scope="col" className="px-3 py-3 font-semibold">Tên</th><th scope="col" className="px-3 py-3 font-semibold">Slug</th><th scope="col" className="px-3 py-3 font-semibold">Thứ tự</th><th scope="col" className="px-3 py-3 font-semibold">Trạng thái</th><th scope="col" className="px-3 py-3 font-semibold">Sản phẩm</th><th scope="col" className="px-3 py-3 text-right font-semibold">Thao tác</th></tr></thead><tbody>{rows.map((category) => <tr key={category.id} className="border-t border-slate-200 hover:bg-slate-50"><td className="px-3 py-3">{category.image ? <Image src={category.image} alt="" width={40} height={40} unoptimized className="size-10 rounded-md border border-slate-200 object-cover" /> : <span className="grid size-10 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-500">--</span>}</td><td className="px-3 py-3 font-semibold text-slate-950">{category.name}</td><td className="px-3 py-3 text-slate-600">{category.slug}</td><td className="px-3 py-3 tabular-nums">{category.sort_order ?? 0}</td><td className="px-3 py-3"><Badge tone={category.status === "active" ? "success" : "neutral"}>{category.status === "active" ? "Đang hoạt động" : "Đã tắt"}</Badge></td><td className="px-3 py-3 tabular-nums">{category.products_count ?? 0}</td><td className="px-3 py-3"><div className="flex justify-end gap-2"><Link href={`/admin/categories/${category.id}/edit`} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:border-teal-600 hover:text-teal-800">Sửa</Link><button type="button" disabled={(category.products_count ?? 0) > 0} onClick={() => void remove(category)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-red-700 hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-40">Xóa</button></div></td></tr>)}</tbody></AdminTable><Pagination meta={meta} /></> : null}
    </main>
  );
}

function CategoryTableSkeleton() {
  return <div className="rounded-lg border border-slate-200 bg-white p-4"><Skeleton className="h-10 w-full" /><div className="mt-3 grid gap-2">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div></div>;
}
