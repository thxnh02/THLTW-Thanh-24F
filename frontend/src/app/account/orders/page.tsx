"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Pagination } from "@/components/admin/Pagination";
import { ApiError, apiGetPaginated, apiPost } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import { orderStatusLabel, orderStatusTone, paymentStatusLabel, paymentStatusTone } from "@/lib/order-status";
import type { Order, PaginatedMeta } from "@/types/api";
import { Badge, Button } from "@/components/ui";
import { useConfirm } from "@/contexts/ConfirmContext";

export default function AccountOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = searchParams.get("page") ?? "1";
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const confirm = useConfirm();

  const loadOrders = useCallback(() => {
    setLoading(true);
    setMessage("");

    apiGetPaginated<Order>(`/account/orders?page=${encodeURIComponent(page)}`)
      .then(({ data, meta: nextMeta }) => {
        setOrders(data);
        setMeta(nextMeta);
      })
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/login");
          return;
        }

        setMessage(reason.message);
      })
      .finally(() => setLoading(false));
  }, [page, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOrders();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  async function cancelOrder(code: string) {
    setMessage("");
    if (!await confirm({ title: "Hủy đơn hàng?", message: "Bạn chỉ nên hủy khi chưa muốn tiếp tục đơn hàng này.", confirmLabel: "Hủy đơn" })) return;
    await apiPost(`/account/orders/${code}/cancel`, {});
    setMessage("Đã hủy đơn hàng.");
    loadOrders();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-950">Đơn hàng của tôi</h1>
      {message ? <p className="mt-4 rounded-md bg-slate-100 p-3 text-sm text-slate-700">{message}</p> : null}
      <p className="mt-4 text-sm text-slate-600">{meta.total ?? 0} đơn hàng</p>
      <div className="mt-4 overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-3">Mã đơn</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Thanh toán</th>
              <th className="p-3">Tổng tiền</th>
              <th className="p-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4 text-slate-600" colSpan={5}>Đang tải đơn hàng...</td></tr>
            ) : orders.map((order) => (
              <tr key={order.id} className="border-t border-slate-200">
                <td className="p-3 font-semibold">
                  <Link href={`/account/orders/${order.code}`} className="hover:text-teal-700">
                    {order.code}
                  </Link>
                </td>
                <td className="p-3"><Badge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</Badge></td>
                <td className="p-3"><Badge tone={paymentStatusTone(order.payment_status)}>{paymentStatusLabel(order.payment_status)}</Badge></td>
                <td className="p-3">{formatVnd(order.grand_total)}</td>
                <td className="p-3">
                  <Button
                    variant="secondary"
                    type="button"
                    disabled={order.status !== "pending"}
                    onClick={() => cancelOrder(order.code)}
                    className="min-h-10 px-3 disabled:cursor-not-allowed"
                  >
                    Hủy đơn
                  </Button>
                </td>
              </tr>
            ))}
            {!loading && orders.length === 0 ? (
              <tr>
                <td className="p-4 text-slate-600" colSpan={5}>Chưa có đơn hàng.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <Pagination meta={meta} />
      </div>
    </main>
  );
}
