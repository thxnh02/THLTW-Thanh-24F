"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ApiError, apiGetList, apiPost } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { Order } from "@/types/api";

export default function AccountOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");

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
    await apiPost(`/account/orders/${code}/cancel`, {});
    setMessage("Da huy don hang.");
    loadOrders();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Don hang cua toi</h1>
      {message ? <p className="mt-4 rounded-md bg-slate-100 p-3 text-sm text-slate-700">{message}</p> : null}
      <div className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-3">Ma don</th>
              <th className="p-3">Trang thai</th>
              <th className="p-3">Thanh toan</th>
              <th className="p-3">Tong tien</th>
              <th className="p-3">Thao tac</th>
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
                <td className="p-3">{statusLabel(order.status)}</td>
                <td className="p-3">{order.payment_status}</td>
                <td className="p-3">{formatVnd(order.grand_total)}</td>
                <td className="p-3">
                  <button
                    type="button"
                    disabled={order.status !== "pending"}
                    onClick={() => cancelOrder(order.code)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Huy don
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td className="p-4 text-slate-600" colSpan={5}>
                  Chua co don hang.
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
    pending: "Cho xac nhan",
    confirmed: "Da xac nhan",
    shipping: "Dang giao",
    completed: "Hoan thanh",
    canceled: "Da huy",
  }[status];
}
