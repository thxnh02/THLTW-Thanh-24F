"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiGet, apiGetList, apiPatch } from "@/lib/api";
import type { ReturnRequest } from "@/types/api";

const nextStatuses: Record<ReturnRequest["status"], ReturnRequest["status"][]> = {
  requested: ["approved", "rejected", "canceled"],
  approved: ["received", "canceled"],
  received: ["completed"],
  rejected: [],
  completed: [],
  canceled: [],
};

export default function AdminReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [selected, setSelected] = useState<ReturnRequest | null>(null);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }
    if (status) {
      params.set("status", status);
    }

    apiGetList<ReturnRequest>(`/admin/returns${params.toString() ? `?${params}` : ""}`)
      .then(setReturns)
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/admin/login");
          return;
        }
        setMessage(reason.message);
      })
      .finally(() => setLoading(false));
  }, [query, router, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function loadDetail(id: number) {
    try {
      setSelected(await apiGet<ReturnRequest>(`/admin/returns/${id}`));
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Khong the tai chi tiet.");
    }
  }

  async function updateStatus(status: ReturnRequest["status"]) {
    if (!selected) {
      return;
    }
    setProcessing(true);
    try {
      const updated = await apiPatch<ReturnRequest>(`/admin/returns/${selected.id}/status`, { status });
      setSelected(updated);
      setMessage("Da cap nhat yeu cau doi tra.");
      load();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Khong the cap nhat.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Doi tra / hoan tien</h1>
      {message ? <p className="mt-4 rounded-md bg-white p-3 text-sm text-slate-700">{message}</p> : null}
      <div className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
        <label className="block text-sm font-semibold text-slate-700">
          Tim kiem
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ma doi tra, ma don, khach hang" className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Trang thai
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal">
            <option value="">Tat ca</option>
            {Object.keys(nextStatuses).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr><th className="p-3">Ma</th><th className="p-3">Don hang</th><th className="p-3">Trang thai</th><th className="p-3">Hoan tien</th><th className="p-3">Thao tac</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="p-4 text-slate-600">Dang tai yeu cau...</td></tr> : null}
              {!loading && returns.length === 0 ? <tr><td colSpan={5} className="p-4 text-slate-600">Khong co yeu cau phu hop.</td></tr> : null}
              {!loading && returns.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="p-3 font-semibold">{item.code}</td>
                  <td className="p-3">{item.order?.code}</td>
                  <td className="p-3">{item.status}</td>
                  <td className="p-3">{item.refund_status}</td>
                  <td className="p-3"><button type="button" onClick={() => loadDetail(item.id)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Chi tiet</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside className="h-fit rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          {selected ? (
            <div>
              <h2 className="text-lg font-bold text-slate-950">{selected.code}</h2>
              <p className="mt-1 text-sm text-slate-600">{selected.reason}</p>
              <p className="mt-3 text-sm"><strong>Trang thai:</strong> {selected.status} / {selected.refund_status}</p>
              <div className="mt-4 space-y-2">
                {selected.items?.map((item) => (
                  <div key={item.id} className="rounded-md bg-slate-50 p-3 text-sm">
                    <p className="font-semibold">{item.order_item?.product_name}</p>
                    <p className="text-slate-600">SL doi tra: {item.quantity}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {nextStatuses[selected.status].map((status) => (
                  <button key={status} type="button" onClick={() => updateStatus(status)} className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white">
                    {processing ? "Dang xu ly..." : status}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Chon mot yeu cau de xem chi tiet.</p>
          )}
        </aside>
      </div>
    </main>
  );
}
