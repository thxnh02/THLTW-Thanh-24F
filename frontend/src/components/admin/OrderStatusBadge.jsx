const labels = { pending: "Chờ xử lý", processing: "Đang xử lý", delivered: "Đã giao" };
const tones = { pending: "bg-amber-50 text-amber-800 ring-amber-200", processing: "bg-indigo-50 text-indigo-800 ring-indigo-200", delivered: "bg-emerald-50 text-emerald-800 ring-emerald-200" };

export function orderStatusLabel(status) {
  return labels[status] ?? status ?? "—";
}

export default function OrderStatusBadge({ status }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[status] ?? "bg-slate-50 text-slate-600 ring-slate-200"}`}>{orderStatusLabel(status)}</span>;
}
