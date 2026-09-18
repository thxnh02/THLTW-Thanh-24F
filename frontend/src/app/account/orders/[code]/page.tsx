"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Link from "next/link";

import { API_BASE_URL, ApiError, apiGet } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { Order } from "@/types/api";
import { Badge, ErrorState, Skeleton } from "@/components/ui";

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

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {message ? <ErrorState title="Không thể tải đơn hàng" message="Đơn hàng không tồn tại hoặc hiện không khả dụng." /> : null}
      {!order && !message ? <Skeleton className="h-[520px] w-full" /> : null}
      {order ? (
        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">{order.code}</h1>
              <p className="mt-2 text-sm text-slate-600"><Badge tone={order.status === "completed" ? "success" : order.status === "canceled" ? "danger" : "brand"}>{statusLabel(order.status)}</Badge> · {paymentLabel(order.payment_status)} · {order.created_at ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(order.created_at)) : ""}</p>
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
          <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-700">
            <p><strong>Người nhận:</strong> {order.customer_name} · {order.customer_phone}</p>
            <p><strong>Địa chỉ:</strong> {order.shipping_address}</p>
            <p><strong>Thanh toán:</strong> {paymentMethodLabel(order.payment_method)} · {paymentLabel(order.payment_status)}</p>
            <p><strong>Vận chuyển:</strong> {order.shipping_method_name ?? "Chưa cập nhật"}</p>
            <p><strong>Đơn vị:</strong> {order.shipping_carrier ?? "Chưa cập nhật"}</p>
            <p><strong>Mã vận đơn:</strong> {order.tracking_code ?? "Chưa cập nhật"}</p>
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
          <dl className="mt-4 ml-auto max-w-xs space-y-2 text-sm"><div className="flex justify-between"><dt>Tạm tính</dt><dd>{formatVnd(order.subtotal)}</dd></div><div className="flex justify-between"><dt>Giảm giá</dt><dd>{formatVnd(order.discount_total)}</dd></div><div className="flex justify-between"><dt>Phí vận chuyển</dt><dd>{formatVnd(order.shipping_fee)}</dd></div><div className="flex justify-between border-t border-slate-200 pt-3 text-xl font-bold"><dt>Tổng cộng</dt><dd>{formatVnd(order.grand_total)}</dd></div></dl>
        </section>
      ) : null}
    </main>
  );
}

function statusLabel(status: Order["status"]): string { return { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", shipping: "Đang giao", completed: "Hoàn thành", canceled: "Đã hủy" }[status]; }
function paymentLabel(status: string): string { return { paid: "Đã thanh toán", unpaid: "Chưa thanh toán", failed: "Thanh toán thất bại", refunded: "Đã hoàn tiền" }[status] || status; }
function paymentMethodLabel(method: string): string { return { cod: "Thanh toán khi nhận hàng", vnpay: "VNPay" }[method] || method; }
