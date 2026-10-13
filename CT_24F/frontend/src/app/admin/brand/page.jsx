"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminTable from "@/components/admin/AdminTable";
import Pagination from "@/components/common/Pagination";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import brandServices from "@/services/brandServices";

export default function AdminBrandsPage() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");

  const load = (target = page) => {
    setLoading(true);
    brandServices.getAdminBrands({ page: target }).then((response) => {
      setData(response.data.data); setMeta(response.data.meta); setPage(target);
    }).catch(() => setError("Không tải được thương hiệu.")).finally(() => setLoading(false));
  };

  useEffect(() => {
    brandServices.getAdminBrands({ page: 1 }).then((response) => {
      setData(response.data.data); setMeta(response.data.meta);
    }).catch(() => setError("Không tải được thương hiệu.")).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: "id", label: "ID" }, { key: "name", label: "Tên" }, { key: "slug", label: "Slug" }, { key: "sort_order", label: "Thứ tự" },
    { key: "status", label: "Trạng thái", render: (item) => item.status ? "Hiển thị" : "Ẩn" },
  ];

  const removeBrand = async () => {
    setDeleting(true); setDeleteError("");
    try {
      await brandServices.deleteBrand(selectedBrand.id);
      setData((current) => current.filter((item) => item.id !== selectedBrand.id));
      setMeta((current) => current ? { ...current, total: Math.max(0, current.total - 1) } : current);
      setNotice(`Đã xóa thương hiệu “${selectedBrand.name}”.`); setSelectedBrand(null);
    } catch (requestError) {
      setDeleteError(requestError.response?.data?.message ?? "Không thể xóa thương hiệu lúc này.");
    } finally { setDeleting(false); }
  };

  return <section>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Bộ sưu tập thương hiệu</p><h1 className="section-title">Thương hiệu</h1><p className="mt-2 text-sm text-slate-500">Cập nhật thông tin và thứ tự hiển thị thương hiệu.</p></div><Link className="rounded-full bg-[#193b34] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#28564d]" href="/admin/brand/create">+ Thêm thương hiệu</Link></div>
    {notice && <p aria-live="polite" className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}{error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <AdminTable columns={columns} data={data} loading={loading} renderActions={(item) => <div className="flex gap-3 whitespace-nowrap"><Link className="font-medium text-[#37665b] hover:underline" href={`/admin/brand/${item.id}/edit`}>Sửa</Link><button className="font-medium text-red-600 hover:underline" onClick={() => { setSelectedBrand(item); setDeleteError(""); }} type="button">Xóa</button></div>} />
    <Pagination meta={meta} onPageChange={load} />
    {selectedBrand && <ConfirmDialog busy={deleting} error={deleteError} message={`Bạn có chắc muốn xóa thương hiệu “${selectedBrand.name}”? Nếu thương hiệu đang có sản phẩm, hệ thống sẽ giữ lại và thông báo lý do.`} onCancel={() => setSelectedBrand(null)} onConfirm={removeBrand} title="Xác nhận xóa thương hiệu" />}
  </section>;
}
