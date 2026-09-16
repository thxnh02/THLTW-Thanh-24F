"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError, apiGet } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { Order } from "@/types/api";

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
      {message ? <p className="rounded-md bg-white p-4 text-red-600">{message}</p> : null}
      {!order && !message ? <p className="rounded-md bg-white p-4">Dang tai don hang...</p> : null}
      {order ? (
        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">{order.code}</h1>
          <p className="mt-2 text-sm text-slate-600">{order.status} - {order.payment_status}</p>
          <div className="mt-6 overflow-hidden rounded-md border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr><th className="p-3">San pham</th><th className="p-3">SKU</th><th className="p-3">SL</th><th className="p-3">Tien</th></tr>
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
          <p className="mt-4 text-right text-xl font-bold">{formatVnd(order.grand_total)}</p>
        </section>
      ) : null}
    </main>
  );
}
