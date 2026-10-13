"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminTable from "@/components/admin/AdminTable";
import Pagination from "@/components/common/Pagination";
import categoryServices from "@/services/categoryServices";

export default function AdminCategoriesPage() {
  const [data, setData] = useState([]); const [meta, setMeta] = useState(null); const [page, setPage] = useState(1); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = (target = page) => { setLoading(true); categoryServices.getAdminCategories({ page: target }).then((response) => { setData(response.data.data); setMeta(response.data.meta); setPage(target); }).catch(() => setError("Không tải được danh mục.")).finally(() => setLoading(false)); };
  useEffect(() => { categoryServices.getAdminCategories({ page: 1 }).then((response) => { setData(response.data.data); setMeta(response.data.meta); }).catch(() => setError("Không tải được danh mục.")).finally(() => setLoading(false)); }, []);
  const remove = async (item) => { if (!window.confirm(`Xóa danh mục ${item.name}?`)) return; try { await categoryServices.deleteCategory(item.id); load(page); } catch (requestError) { setError(requestError.response?.data?.message ?? "Không thể xóa danh mục."); } };
  const columns = [{ key: "id", label: "ID" }, { key: "name", label: "Tên" }, { key: "slug", label: "Slug" }, { key: "parent", label: "Danh mục cha", render: (item) => item.parent?.name ?? "—" }, { key: "status", label: "Trạng thái", render: (item) => item.status ? "Hiển thị" : "Ẩn" }];
  return <section><div className="mb-4 flex items-center justify-between"><h1 className="text-2xl font-bold">Danh mục</h1><Link className="rounded bg-blue-600 px-4 py-2 text-white" href="/admin/category/create">Thêm danh mục</Link></div>{error && <p className="mb-3 text-red-600">{error}</p>}<AdminTable columns={columns} data={data} loading={loading} renderActions={(item) => <div className="flex gap-2"><Link className="text-blue-600" href={`/admin/category/${item.id}/edit`}>Sửa</Link><button className="text-red-600" onClick={() => remove(item)}>Xóa</button></div>} /><Pagination meta={meta} onPageChange={load} /></section>;
}
