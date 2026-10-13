"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminTable from "@/components/admin/AdminTable";
import Pagination from "@/components/common/Pagination";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import categoryServices from "@/services/categoryServices";

export default function AdminCategoriesPage() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");

  const load = (target = page) => {
    setLoading(true);
    categoryServices.getAdminCategories({ page: target }).then((response) => {
      setData(response.data.data); setMeta(response.data.meta); setPage(target);
    }).catch(() => setError("Không tải được danh mục.")).finally(() => setLoading(false));
  };

  useEffect(() => {
    categoryServices.getAdminCategories({ page: 1 }).then((response) => {
      setData(response.data.data); setMeta(response.data.meta);
    }).catch(() => setError("Không tải được danh mục.")).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: "id", label: "ID" }, { key: "name", label: "Tên" }, { key: "slug", label: "Slug" },
    { key: "parent", label: "Danh mục cha", render: (item) => item.parent?.name ?? "—" },
    { key: "status", label: "Trạng thái", render: (item) => item.status ? "Hiển thị" : "Ẩn" },
  ];

  const removeCategory = async () => {
    setDeleting(true); setDeleteError("");
    try {
      await categoryServices.deleteCategory(selectedCategory.id);
      setData((current) => current.filter((item) => item.id !== selectedCategory.id));
      setMeta((current) => current ? { ...current, total: Math.max(0, current.total - 1) } : current);
      setNotice(`Đã xóa danh mục “${selectedCategory.name}”.`); setSelectedCategory(null);
    } catch (requestError) {
      setDeleteError(requestError.response?.data?.message ?? "Không thể xóa danh mục lúc này.");
    } finally { setDeleting(false); }
  };

  return <section>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Tổ chức cửa hàng</p><h1 className="section-title">Danh mục</h1><p className="mt-2 text-sm text-slate-500">Quản lý cách sản phẩm được sắp xếp và khám phá.</p></div><Link className="rounded-full bg-[#193b34] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#28564d]" href="/admin/category/create">+ Thêm danh mục</Link></div>
    {notice && <p aria-live="polite" className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}{error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <AdminTable columns={columns} data={data} loading={loading} renderActions={(item) => <div className="flex gap-3 whitespace-nowrap"><Link className="font-medium text-[#37665b] hover:underline" href={`/admin/category/${item.id}/edit`}>Sửa</Link><button className="font-medium text-red-600 hover:underline" onClick={() => { setSelectedCategory(item); setDeleteError(""); }} type="button">Xóa</button></div>} />
    <Pagination meta={meta} onPageChange={load} />
    {selectedCategory && <ConfirmDialog busy={deleting} error={deleteError} message={`Bạn có chắc muốn xóa “${selectedCategory.name}”? Nếu danh mục đang có sản phẩm hoặc danh mục con, hệ thống sẽ giữ lại và thông báo lý do.`} onCancel={() => setSelectedCategory(null)} onConfirm={removeCategory} title="Xác nhận xóa danh mục" />}
  </section>;
}
