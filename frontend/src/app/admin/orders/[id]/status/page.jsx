"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OrderStatusBadge, { orderStatusLabel } from "@/components/admin/OrderStatusBadge";
import orderServices from "@/services/orderServices";

export default function UpdateOrderStatusPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [nextStatus, setNextStatus] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let current = true;
    orderServices.getOrder(id).then(({ data }) => {
      if (current) { setOrder(data.data); setNextStatus(data.data.allowed_next_statuses?.[0] ?? ""); }
    }).catch((requestError) => {
      if (current) setError(requestError.response?.status === 404 ? "Không tìm thấy đơn hàng." : requestError.response?.data?.message ?? "Không thể tải đơn hàng.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [id]);

  const save = async (event) => {
    event.preventDefault();
    if (!confirmed || !nextStatus || submitting) return;
    setSubmitting(true);
    setError("");
    setErrors({});
    try {
      await orderServices.updateStatus(id, nextStatus);
      router.push(`/admin/orders/${id}`);
    } catch (requestError) {
      setErrors(requestError.response?.data?.errors ?? {});
      setError(requestError.response?.data?.message ?? "Không thể cập nhật trạng thái.");
    } finally { setSubmitting(false); }
  };

  return <section className="mx-auto max-w-2xl space-y-5"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Đơn hàng</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Cập nhật trạng thái đơn #{id}</h1></header>{loading && <p className="rounded-xl bg-white p-5 text-slate-500">Đang tải đơn hàng…</p>}{error && <p className="rounded-xl bg-rose-50 p-4 text-rose-800" role="alert">{error}</p>}{order && <form className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={save}><div><p className="text-sm text-slate-500">Trạng thái hiện tại</p><div className="mt-2"><OrderStatusBadge status={order.status} /></div><p className="mt-3 text-sm text-slate-600">Người dùng: {order.user?.name ?? "—"}</p></div>{order.allowed_next_statuses?.length ? <><label className="admin-label">Trạng thái tiếp theo<select className="admin-input" value={nextStatus} onChange={(event) => { setNextStatus(event.target.value); setConfirmed(false); }}>{order.allowed_next_statuses.map((status) => <option key={status} value={status}>{orderStatusLabel(status)}</option>)}</select>{errors.status?.[0] && <small className="mt-1 block text-rose-700" role="alert">{errors.status[0]}</small>}</label><label className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><input checked={confirmed} className="mt-0.5 size-4 accent-amber-700" onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" />Tôi xác nhận chuyển trạng thái đơn hàng sang {orderStatusLabel(nextStatus)}.</label></> : <p className="text-sm text-slate-600">Đơn hàng đã ở trạng thái cuối, không thể cập nhật thêm.</p>}<div className="flex gap-3"><Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700" href={`/admin/orders/${id}`}>Quay lại</Link>{order.allowed_next_statuses?.length > 0 && <button className="min-h-11 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={!confirmed || submitting} type="submit">{submitting ? "Đang cập nhật…" : "Xác nhận cập nhật"}</button>}</div></form>}</section>;
}
