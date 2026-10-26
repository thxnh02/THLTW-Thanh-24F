"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import orderServices from "@/services/orderServices";

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    orderServices.getOrder(id).then(({ data }) => { if (current) setOrder(data.data); }).catch((requestError) => {
      if (current) setError(requestError.response?.status === 404 ? "Không tìm thấy đơn hàng." : requestError.response?.data?.message ?? "Không thể tải đơn hàng.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [id]);

  return <section className="mx-auto max-w-3xl space-y-5"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Đơn hàng</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Chi tiết đơn #{id}</h1></header>{loading && <p className="rounded-xl bg-white p-5 text-slate-500">Đang tải đơn hàng…</p>}{error && <p className="rounded-xl bg-rose-50 p-5 text-rose-800" role="alert">{error}</p>}{order && <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-semibold uppercase text-slate-500">Trạng thái</dt><dd className="mt-2"><OrderStatusBadge status={order.status} /></dd></div><div><dt className="text-xs font-semibold uppercase text-slate-500">Ngày tạo</dt><dd className="mt-1">{new Date(order.created_at).toLocaleString("vi-VN")}</dd></div><div><dt className="text-xs font-semibold uppercase text-slate-500">Người dùng</dt><dd className="mt-1 font-semibold">{order.user?.name ?? "—"}</dd></div><div><dt className="text-xs font-semibold uppercase text-slate-500">Email</dt><dd className="mt-1">{order.user?.email ?? "—"}</dd></div></dl><p className="text-sm text-slate-500">Dữ liệu hiện tại chỉ lưu người đặt và trạng thái; chưa có chi tiết mặt hàng hoặc thanh toán.</p><div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5"><Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700" href="/admin/orders">Quay lại</Link>{order.allowed_next_statuses?.length > 0 && <Link className="inline-flex min-h-11 items-center rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800" href={`/admin/orders/${id}/status`}>Cập nhật trạng thái</Link>}</div></div>}</section>;
}
