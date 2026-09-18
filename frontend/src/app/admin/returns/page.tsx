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
      setMessage(reason instanceof Error ? reason.message : "Không thể tải chi tiết.");
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
      setMessage("Đã cập nhật yêu cầu đổi trả.");
      load();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Không thể cập nhật.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Đổi trả / hoàn tiền</h1>
      {message ? <p className="mt-4 rounded-md bg-white p-3 text-sm text-slate-700">{message}</p> : null}
      <div className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
        <label className="block text-sm font-semibold text-slate-700">
          Tìm kiếm
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mã đổi trả, mã đơn, khách hàng" className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Trạng thái
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal">
            <option value="">Tất cả</option>
            {Object.keys(nextStatuses).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr><th className="p-3">Mã yêu cầu</th><th className="p-3">Đơn hàng</th><th className="p-3">Trạng thái</th><th className="p-3">Hoàn tiền</th><th className="p-3">Thao tác</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="p-4 text-slate-600">Đang tải yêu cầu...</td></tr> : null}
              {!loading && returns.length === 0 ? <tr><td colSpan={5} className="p-4 text-slate-600">Không có yêu cầu phù hợp.</td></tr> : null}
              {!loading && returns.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="p-3 font-semibold">{item.code}</td>
                  <td className="p-3">{item.order?.code}</td>
                  <td className="p-3">{item.status}</td>
                  <td className="p-3">{item.refund_status}</td>
                  <td className="p-3"><button type="button" onClick={() => loadDetail(item.id)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Chi tiết</button></td>
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
              <p className="mt-3 text-sm"><strong>Trạng thái:</strong> {selected.status} / {selected.refund_status}</p>
              <div className="mt-4 space-y-2">
                {selected.items?.map((item) => (
                  <div key={item.id} className="rounded-md bg-slate-50 p-3 text-sm">
                    <p className="font-semibold">{item.order_item?.product_name}</p>
                    <p className="text-slate-600">Số lượng đổi trả: {item.quantity}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {nextStatuses[selected.status].map((status) => (
                  <button key={status} type="button" onClick={() => updateStatus(status)} className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white">
                    {processing ? "Đang xử lý..." : status}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Chọn một yêu cầu để xem chi tiết.</p>
          )}
        </aside>
      </div>
    </main>
  );
}
