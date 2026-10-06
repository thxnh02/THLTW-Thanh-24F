"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiGet } from "@/lib/api";
import { formatDateTime, formatVnd } from "@/lib/format";
import { orderStatusLabel, orderStatusTone, paymentMethodLabel, paymentStatusLabel } from "@/lib/order-status";
import type { Order } from "@/types/api";

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiGet<Order>(`/admin/orders/${params.id}`).then(setOrder).catch((reason: Error) => setMessage(reason.message));
  }, [params.id]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between"><h1 className="text-3xl font-bold text-slate-950">Chi tiết đơn hàng</h1><Link href="/admin/orders" className="text-sm font-semibold">Quay lại</Link></div>
      {message ? <p className="text-sm text-rose-700">{message}</p> : order ? <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="rounded-md border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">{order.code}</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-slate-500">Khách hàng</dt><dd>{order.customer_name}</dd></div>
            <div><dt className="text-xs text-slate-500">Email</dt><dd>{order.customer_email}</dd></div>
            <div><dt className="text-xs text-slate-500">Trạng thái</dt><dd><StatusBadge status={order.status} /></dd></div>
            <div><dt className="text-xs text-slate-500">Thanh toán</dt><dd>{paymentStatusLabel(order.payment_status)}</dd></div>
            <div><dt className="text-xs text-slate-500">Phương thức</dt><dd>{paymentMethodLabel(order.payment_method)}</dd></div>
            <div><dt className="text-xs text-slate-500">Tổng tiền</dt><dd>{formatVnd(order.grand_total)}</dd></div>
            {order.payment?.paid_at ? <div><dt className="text-xs text-slate-500">Thanh toán lúc</dt><dd>{formatDateTime(order.payment.paid_at)}</dd></div> : null}
            {order.payment_method === "vnpay" && order.payment?.transaction_ref ? <div><dt className="text-xs text-slate-500">Mã giao dịch</dt><dd>{order.payment.transaction_ref}</dd></div> : null}
          </dl>
          <div className="mt-6 border-t border-slate-200 pt-5"><h2 className="font-bold">Lịch sử trạng thái</h2><div className="mt-4 space-y-3">{order.histories?.map((history) => <div key={history.id} className="rounded-md bg-slate-50 p-3 text-sm"><p className="font-semibold">{history.from_status ? `${orderStatusLabel(history.from_status)} → ` : ""}{orderStatusLabel(history.to_status)}</p><p className="text-slate-500">{formatDateTime(history.created_at)}</p>{history.note ? <p className="mt-1 text-slate-600">Ghi chú: {history.note}</p> : null}</div>)}{!order.histories?.length ? <p className="text-sm text-slate-500">Chưa có lịch sử trạng thái.</p> : null}</div></div>
        </section>
        <section className="rounded-md border border-slate-200 bg-white p-6"><h2 className="font-bold">Sản phẩm</h2><div className="mt-4 divide-y divide-slate-100">{order.items?.map((item) => <div key={item.id} className="py-3"><p className="font-semibold">{item.product_name}</p><p className="text-sm text-slate-500">{item.variant_name} · SKU {item.sku} · SL {item.quantity} · {formatVnd(item.subtotal)}</p></div>)}</div></section>
      </div> : <p className="text-sm text-slate-500">Đang tải...</p>}
    </main>
  );
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const tone = orderStatusTone(status);
  const styles = { brand: "bg-teal-50 text-teal-800", success: "bg-emerald-50 text-emerald-800", warning: "bg-amber-50 text-amber-800", danger: "bg-red-50 text-red-800", neutral: "bg-slate-100 text-slate-700" };
  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${styles[tone]}`}>{orderStatusLabel(status)}</span>;
}
