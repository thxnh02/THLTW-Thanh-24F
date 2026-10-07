"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { API_BASE_URL, ApiError, apiGet } from "@/lib/api";
import { formatDateTime, formatVnd } from "@/lib/format";
import { orderStatusLabel, orderStatusTone, paymentMethodLabel, paymentStatusLabel, paymentStatusTone, type StatusTone } from "@/lib/order-status";
import type { Order } from "@/types/api";
import { Badge, ErrorState, Skeleton } from "@/components/ui";

type TimelineEntry = {
  id: string;
  label: string;
  created_at: string;
  tone: StatusTone;
};

export default function AccountOrderDetailPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiGet<Order>(`/account/orders/${params.code}`)
      .then(setOrder)
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/login");
          return;
        }

        setMessage(reason.message);
      });
  }, [params.code, router]);

  const timeline: TimelineEntry[] = order ? [
    {
      id: `created-${order.id}`,
      label: "Đã đặt hàng",
      created_at: order.created_at,
      tone: "brand",
    },
    ...(order.histories ?? []).map((history) => ({
      id: String(history.id),
      label: orderStatusLabel(history.to_status),
      created_at: history.created_at,
      tone: orderStatusTone(history.to_status),
    })),
  ] : [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {message ? <ErrorState title="Không thể tải đơn hàng" message="Đơn hàng không tồn tại hoặc hiện không khả dụng." /> : null}
      {!order && !message ? <Skeleton className="h-[520px] w-full" /> : null}
      {order ? (
        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">{order.code}</h1>
              <p className="mt-2 text-sm text-slate-600">
                <Badge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
                <span className="mx-2">·</span>
                <Badge tone={paymentStatusTone(order.payment_status)}>{paymentStatusLabel(order.payment_status)}</Badge>
                <span className="mx-2">·</span>
                {formatDateTime(order.created_at)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`${API_BASE_URL}/account/orders/${order.code}/invoice`} target="_blank" rel="noreferrer" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
                Hóa đơn
              </a>
              <a href={`${API_BASE_URL}/account/orders/${order.code}/invoice.pdf`} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
                PDF
              </a>
              {order.status === "completed" ? (
                <Link href={`/account/orders/${order.code}/return`} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                  Yêu cầu đổi trả
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-6 rounded-md border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-950">Tiến trình đơn hàng</h2>
            <ol className="mt-4 space-y-4">
              {timeline.map((entry, index) => (
                <li key={entry.id} className="relative flex gap-3">
                  {index < timeline.length - 1 ? <span className="absolute left-[7px] top-5 h-full w-px bg-slate-200" aria-hidden="true" /> : null}
                  <span className={`relative mt-1 size-4 shrink-0 rounded-full ${entry.tone === "success" ? "bg-emerald-500" : entry.tone === "danger" ? "bg-red-500" : entry.tone === "warning" ? "bg-amber-500" : "bg-teal-600"}`} aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-slate-900">{entry.label}</p>
                    <p className="text-sm text-slate-500">{formatDateTime(entry.created_at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-700">
            <p><strong>Người nhận:</strong> {order.customer_name} · {order.customer_phone}</p>
            <p><strong>Địa chỉ:</strong> {order.shipping_address}</p>
            <p><strong>Thanh toán:</strong> {paymentMethodLabel(order.payment_method)} · {paymentStatusLabel(order.payment_status)}</p>
            {order.payment?.paid_at ? <p><strong>Thanh toán lúc:</strong> {formatDateTime(order.payment.paid_at)}</p> : null}
            {order.payment_method === "vnpay" && order.payment?.transaction_ref ? <p><strong>Mã giao dịch:</strong> {order.payment.transaction_ref}</p> : null}
            <p><strong>Vận chuyển:</strong> {order.shipping_method_name ?? "Chưa cập nhật"}</p>
            <p><strong>Đơn vị:</strong> {order.shipping_carrier ?? "Chưa cập nhật"}</p>
            <p><strong>Mã vận đơn:</strong> {order.tracking_code ?? "Chưa cập nhật"}</p>
            {order.shipped_at ? <p><strong>Đã gửi lúc:</strong> {formatDateTime(order.shipped_at)}</p> : null}
            {order.delivered_at ? <p><strong>Đã giao lúc:</strong> {formatDateTime(order.delivered_at)}</p> : null}
          </div>

          <div className="mt-6 overflow-hidden rounded-md border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr><th className="p-3">Sản phẩm</th><th className="p-3">SKU</th><th className="p-3">SL</th><th className="p-3">Thành tiền</th></tr>
              </thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="p-3 font-semibold">{item.product_name} - {item.variant_name}</td>
                    <td className="p-3">{item.sku}</td>
                    <td className="p-3">{item.quantity}</td>
                    <td className="p-3">{formatVnd(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="mt-4 ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between"><dt>Tạm tính</dt><dd>{formatVnd(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Giảm giá</dt><dd>{formatVnd(order.discount_total)}</dd></div>
            <div className="flex justify-between"><dt>Phí vận chuyển</dt><dd>{formatVnd(order.shipping_fee)}</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-xl font-bold"><dt>Tổng cộng</dt><dd>{formatVnd(order.grand_total)}</dd></div>
          </dl>
        </section>
      ) : null}
    </main>
  );
}
