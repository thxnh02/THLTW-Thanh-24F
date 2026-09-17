"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { ApiError, apiGet, apiPost } from "@/lib/api";
import type { Order, ReturnRequest } from "@/types/api";

export default function AccountOrderReturnPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [reason, setReason] = useState("Khong phu hop");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiGet<Order>(`/account/orders/${params.code}`)
      .then((payload) => {
        setOrder(payload);
        setQuantities(Object.fromEntries((payload.items ?? []).map((item) => [item.id, 0])));
      })
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/login");
          return;
        }
        setMessage(reason.message);
      });
  }, [params.code, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order) {
      return;
    }
    const items = Object.entries(quantities)
      .map(([orderItemId, quantity]) => ({ order_item_id: Number(orderItemId), quantity }))
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      setMessage("Chon it nhat mot san pham.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const result = await apiPost<ReturnRequest>("/account/returns", {
        order_code: order.code,
        reason,
        description: description || undefined,
        items,
      });
      setMessage(`Da gui yeu cau doi tra ${result.code}.`);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Khong the gui yeu cau.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Yeu cau doi tra</h1>
      {!order && !message ? <p className="mt-6 rounded-md bg-white p-4">Dang tai don hang...</p> : null}
      {message ? <p className="mt-4 rounded-md bg-white p-3 text-sm text-slate-700">{message}</p> : null}
      {order ? (
        <form onSubmit={submit} className="mt-6 grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-semibold">{order.code}</p>
          <label className="block text-sm font-semibold text-slate-700">
            Ly do
            <input value={reason} onChange={(event) => setReason(event.target.value)} required className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Mo ta
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 font-normal" />
          </label>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <label key={item.id} className="grid gap-2 rounded-md bg-slate-50 p-3 text-sm md:grid-cols-[1fr_120px]">
                <span><strong>{item.product_name}</strong><br />{item.variant_name} - {item.sku} | Da mua: {item.quantity}</span>
                <input type="number" min={0} max={item.quantity} value={quantities[item.id] ?? 0} onChange={(event) => setQuantities({ ...quantities, [item.id]: Number(event.target.value) })} className="h-10 rounded-md border border-slate-300 px-3" />
              </label>
            ))}
          </div>
          <button disabled={submitting} className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300">
            {submitting ? "Dang gui..." : "Gui yeu cau"}
          </button>
        </form>
      ) : null}
    </main>
  );
}
