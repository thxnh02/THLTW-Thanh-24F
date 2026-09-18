"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ApiError, apiGetList, apiPost } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { Order } from "@/types/api";
import { Badge, Button } from "@/components/ui";
import { useConfirm } from "@/contexts/ConfirmContext";

export default function AccountOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const confirm = useConfirm();

  const loadOrders = useCallback(() => {
    apiGetList<Order>("/account/orders")
      .then(setOrders)
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/login");
          return;
        }

        setMessage(reason.message);
      });
  }, [router]);

  useEffect(() => {
    loadOrders();
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
      <div className="mt-6 overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
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
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-slate-200">
                <td className="p-3 font-semibold">
                  <Link href={`/account/orders/${order.code}`} className="hover:text-teal-700">
                    {order.code}
                  </Link>
                </td>
                <td className="p-3"><Badge tone={order.status === "completed" ? "success" : order.status === "canceled" ? "danger" : "brand"}>{statusLabel(order.status)}</Badge></td>
                <td className="p-3">{order.payment_status}</td>
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
            {orders.length === 0 ? (
              <tr>
                <td className="p-4 text-slate-600" colSpan={5}>
                  Chưa có đơn hàng.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function statusLabel(status: Order["status"]): string {
  return {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao",
    completed: "Hoàn thành",
    canceled: "Đã hủy",
  }[status];
}
