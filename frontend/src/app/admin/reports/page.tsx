"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { API_BASE_URL, ApiError, apiGet } from "@/lib/api";
import { formatVnd } from "@/lib/format";

type ReportPayload = {
  date_from: string;
  date_to: string;
  gross_revenue: string | number;
  valid_revenue: string | number;
  completed_revenue: string | number;
  order_count: number;
  completed_count: number;
  canceled_count: number;
  average_order_value: string | number;
  discount_total: string | number;
  shipping_revenue: string | number;
  new_customers: number;
  out_of_stock: number;
  top_products: { product_name: string; sku: string; quantity_sold: number; revenue: string | number }[];
  low_stock: { id: number; sku: string; stock_quantity: number; product?: { name: string } }[];
};

export default function AdminReportsPage() {
  const router = useRouter();
  const [range, setRange] = useState("last_30_days");
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    apiGet<ReportPayload>(`/admin/reports/overview?range=${range}`)
      .then(setReport)
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/admin/login");
          return;
        }
        setMessage(reason.message);
      });
  }, [range, router]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-950">Báo cáo</h1>
        <div className="flex gap-2">
          <select value={range} onChange={(event) => setRange(event.target.value)} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
            <option value="today">Hôm nay</option>
            <option value="last_7_days">7 ngày</option>
            <option value="last_30_days">30 ngày</option>
            <option value="this_month">Tháng này</option>
          </select>
          <a href={`${API_BASE_URL}/admin/reports/export?range=${range}`} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">Xuất CSV</a>
        </div>
      </div>
      {message ? <p className="mt-4 rounded-md bg-white p-3 text-sm text-red-600">{message}</p> : null}
      {!report ? <p className="mt-6 rounded-md bg-white p-4">Đang tải báo cáo...</p> : null}
      {report ? (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <Metric label="Doanh thu hợp lệ" value={formatVnd(report.valid_revenue)} />
            <Metric label="Đơn hàng" value={String(report.order_count)} />
            <Metric label="Hoàn thành" value={String(report.completed_count)} />
            <Metric label="Đã hủy" value={String(report.canceled_count)} />
            <Metric label="AOV" value={formatVnd(report.average_order_value)} />
            <Metric label="Giảm giá" value={formatVnd(report.discount_total)} />
            <Metric label="Phí vận chuyển" value={formatVnd(report.shipping_revenue)} />
            <Metric label="Khách mới" value={String(report.new_customers)} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-950">Sản phẩm bán chạy</h2>
              <div className="mt-3 space-y-2 text-sm">
                {report.top_products.map((item) => (
                  <div key={`${item.product_name}-${item.sku}`} className="flex justify-between gap-4 rounded-md bg-slate-50 p-3">
                    <span>{item.product_name}<br /><span className="text-xs text-slate-500">{item.sku}</span></span>
                    <strong>{item.quantity_sold} / {formatVnd(item.revenue)}</strong>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-950">Tồn kho thấp</h2>
              <div className="mt-3 space-y-2 text-sm">
                {report.low_stock.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 rounded-md bg-slate-50 p-3">
                    <span>{item.product?.name ?? item.sku}<br /><span className="text-xs text-slate-500">{item.sku}</span></span>
                    <strong>{item.stock_quantity}</strong>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}
