"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminTable from "@/components/admin/AdminTable";
import Pagination from "@/components/common/Pagination";
import userServices from "@/services/userServices";

export default function UsersPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    userServices.getUsers({ page }).then(({ data }) => {
      if (current) { setRows(data.data); setMeta(data.meta); setError(""); }
    }).catch((requestError) => {
      if (current) setError(requestError.response?.data?.message ?? "Không thể tải danh sách người dùng.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [page, retry]);

  const columns = [
    { key: "name", label: "Người dùng", render: (row) => <span><span className="block font-semibold text-slate-900">{row.name}</span><span className="block text-xs text-slate-500">{row.email}</span></span> },
    { key: "orders_count", label: "Đơn hàng" },
    { key: "blocked_at", label: "Trạng thái", render: (row) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.blocked_at ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{row.blocked_at ? "Đã khóa" : "Hoạt động"}</span> },
  ];

  return <section className="space-y-5"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Tài khoản</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Người dùng</h1><p className="mt-2 text-sm text-slate-600">Danh sách tài khoản và trạng thái khóa thực tế.</p></header><AdminTable columns={columns} data={rows} emptyMessage="Chưa có người dùng nào." error={error} loading={loading} onRetry={() => { setLoading(true); setRetry((value) => value + 1); }} renderActions={(row) => <><Link className="rounded-lg bg-indigo-50 px-3 text-sm font-semibold text-indigo-800 hover:bg-indigo-100" href={`/admin/users/${row.id}`}>Chi tiết</Link><Link className={`rounded-lg px-3 text-sm font-semibold ${row.blocked_at ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`} href={`/admin/users/${row.id}/${row.blocked_at ? "unblock" : "block"}`}>{row.blocked_at ? "Mở khóa" : "Khóa"}</Link></>} /><Pagination meta={meta} onPageChange={(next) => { setLoading(true); setPage(next); }} /></section>;
}
