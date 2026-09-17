"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { API_BASE_URL, ApiError, apiGet, apiGetList, apiPatch } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { Order } from "@/types/api";

const nextStatuses: Record<Order["status"], Order["status"][]> = {
  pending: ["confirmed", "canceled"],
  confirmed: ["shipping", "canceled"],
  shipping: ["completed", "canceled"],
  completed: [],
  canceled: [],
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [tracking, setTracking] = useState({ carrier: "", code: "" });
  const [message, setMessage] = useState("");

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }
    if (status) {
      params.set("status", status);
    }
    return params.toString();
  }, [query, status]);

  const loadOrders = useCallback(() => {
    apiGetList<Order>(`/admin/orders?${searchParams}`)
      .then(setOrders)
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/admin/login");
          return;
        }
        setMessage(reason.message);
      });
  }, [router, searchParams]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function loadDetail(id: number) {
    const detail = await apiGet<Order>(`/admin/orders/${id}`);
    setSelectedOrder(detail);
    setTracking({ carrier: detail.shipping_carrier ?? "", code: detail.tracking_code ?? "" });
  }

  async function updateStatus(order: Order, nextStatus: Order["status"]) {
    setMessage("");
    const updated = await apiPatch<Order>(`/admin/orders/${order.id}/status`, {
      status: nextStatus,
      shipping_carrier: tracking.carrier || undefined,
      tracking_code: tracking.code || undefined,
    });
    setMessage("Da cap nhat trang thai don hang.");
    setSelectedOrder(updated);
    loadOrders();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Quan ly don hang</h1>
      <div className="mt-4 flex justify-end">
        <a href={`${API_BASE_URL}/admin/orders/export${searchParams ? `?${searchParams}` : ""}`} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
          Xuat CSV
        </a>
      </div>
      <div className="mt-6 grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
        <label className="block text-sm font-semibold text-slate-700">
          Tim kiem
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950"
            placeholder="Ma don, ten, email, phone"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Trang thai
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950"
          >
            <option value="">Tat ca</option>
            <option value="pending">Cho xac nhan</option>
            <option value="confirmed">Da xac nhan</option>
            <option value="shipping">Dang giao</option>
            <option value="completed">Hoan thanh</option>
            <option value="canceled">Da huy</option>
          </select>
        </label>
      </div>
      {message ? <p className="mt-4 rounded-md bg-slate-100 p-3 text-sm text-slate-700">{message}</p> : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Ma don</th>
                <th className="p-3">Khach hang</th>
                <th className="p-3">Trang thai</th>
                <th className="p-3">Tong tien</th>
                <th className="p-3">Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-slate-200">
                  <td className="p-3 font-semibold">{order.code}</td>
                  <td className="p-3">
                    <p>{order.customer_name}</p>
                    <p className="text-xs text-slate-500">{order.payment_method.toUpperCase()}</p>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="p-3">{formatVnd(order.grand_total)}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => loadDetail(order.id)}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"
                    >
                      Chi tiet
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="h-fit rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          {selectedOrder ? (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">{selectedOrder.code}</h2>
                  <p className="text-sm text-slate-600">{selectedOrder.customer_name}</p>
                </div>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Email" value={selectedOrder.customer_email} />
                <Row label="Dien thoai" value={selectedOrder.customer_phone} />
                <Row label="Dia chi" value={selectedOrder.shipping_address} />
                <Row label="Van chuyen" value={selectedOrder.shipping_method_name ?? "Tieu chuan"} />
                <Row label="Don vi" value={selectedOrder.shipping_carrier ?? "Dang cap nhat"} />
                <Row label="Ma van don" value={selectedOrder.tracking_code ?? "Dang cap nhat"} />
                <Row label="Tong tien" value={formatVnd(selectedOrder.grand_total)} />
                <Row label="Thanh toan" value={selectedOrder.payment_status} />
              </dl>
              {selectedOrder.status === "confirmed" ? (
                <div className="mt-4 grid gap-3 rounded-md bg-slate-50 p-3">
                  <Input label="Don vi van chuyen" value={tracking.carrier} onChange={(value) => setTracking({ ...tracking, carrier: value })} />
                  <Input label="Ma van don" value={tracking.code} onChange={(value) => setTracking({ ...tracking, code: value })} />
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={`${API_BASE_URL}/admin/orders/${selectedOrder.id}/invoice`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"
                >
                  Hoa don
                </a>
                <a
                  href={`${API_BASE_URL}/admin/orders/${selectedOrder.id}/invoice.pdf`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"
                >
                  PDF
                </a>
                {nextStatuses[selectedOrder.status].map((nextStatus) => (
                  <button
                    key={nextStatus}
                    type="button"
                    onClick={() => updateStatus(selectedOrder, nextStatus)}
                    className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
                  >
                    {statusLabel(nextStatus)}
                  </button>
                ))}
              </div>
              <div className="mt-6 border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-950">San pham</h3>
                <div className="mt-3 space-y-3">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="rounded-md bg-slate-50 p-3 text-sm">
                      <p className="font-semibold">{item.product_name}</p>
                      <p className="text-slate-600">
                        {item.variant_name} - {item.sku} x {item.quantity}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Chon mot don hang de xem chi tiet.</p>
          )}
        </aside>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: Order["status"] }) {
  return (
    <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
      {statusLabel(status)}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950" />
    </label>
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
