/** Distinguishes visibility from the separate soft-delete state. */
export default function StatusBadge({ status, deletedAt }) {
  if (deletedAt) {
    return <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">Trong thùng rác</span>;
  }

  if (status === true || status === 1) {
    return <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">Hiển thị</span>;
  }

  if (status === false || status === 0) {
    return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">Đã ẩn</span>;
  }

  return <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200">—</span>;
}
