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

  return <section className="mx-auto max-w-3xl space-y-5"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Đơn hàng</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Chi tiết đơn #{id}</h1></header>{loading && <p className="rounded-xl bg-white p-5 text-slate-500">Đang tải đơn hàng…</p>}{error && <p className="rounded-xl bg-rose-50 p-5 text-rose-800" role="alert">{error}</p>}{order && <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-semibold uppercase text-slate-500">Trạng thái</dt><dd className="mt-2"><OrderStatusBadge status={order.status} /></dd></div><div><dt className="text-xs font-semibold uppercase text-slate-500">Ngày tạo</dt><dd className="mt-1">{new Date(order.created_at).toLocaleString("vi-VN")}</dd></div><div><dt className="text-xs font-semibold uppercase text-slate-500">Người dùng</dt><dd className="mt-1 font-semibold">{order.user?.name ?? "—"}</dd></div><div><dt className="text-xs font-semibold uppercase text-slate-500">Email</dt><dd className="mt-1">{order.user?.email ?? "—"}</dd></div></dl><div className="rounded-xl bg-slate-50 p-4 text-sm"><p className="font-semibold">Thanh toán: {order.status === "cancelled" && order.payment_method === "cod" ? "Đơn COD mô phỏng đã hủy, không có tiền thực nhận" : order.payment_status === "demo_paid" ? "Đã thanh toán (mô phỏng COD, chưa nhận tiền thực)" : order.payment_status === "paid" ? "VNPay đã xác nhận bằng IPN" : order.payment_status === "pending" ? "Đang chờ xác nhận VNPay" : order.payment_status === "failed" ? "Thanh toán thất bại" : "Đơn cũ chưa có dữ liệu thanh toán"}</p><p className="mt-2">Tổng tiền: {order.grand_total_vnd == null ? "—" : `${Number(order.grand_total_vnd).toLocaleString("vi-VN")} đ`}</p></div><div><h2 className="font-semibold">Sản phẩm</h2>{order.items?.length ? order.items.map((item) => <p className="mt-2 text-sm" key={item.id}>{item.product_name} × {item.quantity}</p>) : <p className="mt-2 text-sm text-slate-500">Đơn cũ chưa có chi tiết sản phẩm.</p>}</div>{order.shipping_snapshot && <div className="text-sm"><h2 className="font-semibold">Địa chỉ khi đặt</h2><p className="mt-1">{order.shipping_snapshot.recipient_name} · {order.shipping_snapshot.recipient_phone}</p><p>{[order.shipping_snapshot.detail, order.shipping_snapshot.street, order.shipping_snapshot.ward, order.shipping_snapshot.district, order.shipping_snapshot.province].filter(Boolean).join(", ")}</p></div>}{order.payment_attempts?.length > 0 && <div><h2 className="font-semibold">Lần thanh toán VNPay</h2><div className="mt-2 space-y-2">{order.payment_attempts.map((attempt) => <p className="rounded-lg bg-slate-50 p-3 text-xs" key={attempt.id}><span className="font-semibold">{{ pending: "Đang chờ", succeeded: "Đã xác nhận", failed: "Thất bại" }[attempt.state] ?? attempt.state}</span> · {attempt.txn_ref} · {attempt.response_code ?? "Chưa có phản hồi"}</p>)}</div></div>}<div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5"><Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700" href="/admin/orders">Quay lại</Link>{order.allowed_next_statuses?.length > 0 && <Link className="inline-flex min-h-11 items-center rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800" href={`/admin/orders/${id}/status`}>Cập nhật trạng thái</Link>}</div></div>}</section>;
}
