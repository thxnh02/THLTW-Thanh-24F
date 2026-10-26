"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminTable from "@/components/admin/AdminTable";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import Pagination from "@/components/common/Pagination";
import orderServices from "@/services/orderServices";

export default function OrdersPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    orderServices.getOrders({ page, ...(status ? { status } : {}) }).then(({ data }) => {
      if (current) { setRows(data.data); setMeta(data.meta); setError(""); }
    }).catch((requestError) => {
      if (current) setError(requestError.response?.data?.message ?? "Không thể tải đơn hàng.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [page, status, retry]);

  const columns = [
    { key: "id", label: "Mã đơn", render: (row) => `#${row.id}` },
    { key: "user", label: "Người dùng", render: (row) => <span><span className="block font-semibold text-slate-900">{row.user?.name ?? "—"}</span><span className="block text-xs text-slate-500">{row.user?.email ?? ""}</span></span> },
    { key: "status", label: "Trạng thái", render: (row) => <OrderStatusBadge status={row.status} /> },
    { key: "created_at", label: "Ngày tạo", render: (row) => new Date(row.created_at).toLocaleString("vi-VN") },
  ];

  return <section className="space-y-5"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Quản lý đơn hàng</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Đơn hàng</h1><p className="mt-2 text-sm text-slate-600">Theo dõi trạng thái đơn hàng đã có trong database.</p></header><label className="block max-w-xs text-sm font-medium text-slate-700">Lọc trạng thái<select className="admin-input mt-1" value={status} onChange={(event) => { setLoading(true); setPage(1); setStatus(event.target.value); }}><option value="">Tất cả</option><option value="pending">Chờ xử lý</option><option value="processing">Đang xử lý</option><option value="delivered">Đã giao</option></select></label><AdminTable columns={columns} data={rows} emptyMessage="Chưa có đơn hàng nào." error={error} loading={loading} onRetry={() => { setLoading(true); setRetry((value) => value + 1); }} renderActions={(row) => <><Link className="rounded-lg bg-indigo-50 px-3 text-sm font-semibold text-indigo-800 hover:bg-indigo-100" href={`/admin/orders/${row.id}`}>Chi tiết</Link>{row.allowed_next_statuses?.length > 0 && <Link className="rounded-lg bg-amber-50 px-3 text-sm font-semibold text-amber-800 hover:bg-amber-100" href={`/admin/orders/${row.id}/status`}>Cập nhật</Link>}</>} /><Pagination meta={meta} onPageChange={(next) => { setLoading(true); setPage(next); }} /></section>;
}
