export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;
  return <nav aria-label="Phân trang" className="mt-4 flex flex-wrap items-center gap-3">
    <button aria-label="Trang trước" className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-40" disabled={meta.current_page === 1} onClick={() => onPageChange(meta.current_page - 1)}>Trước</button>
    <span aria-current="page" className="text-sm text-slate-600">Trang {meta.current_page} / {meta.last_page}</span>
    <button aria-label="Trang sau" className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-40" disabled={meta.current_page === meta.last_page} onClick={() => onPageChange(meta.current_page + 1)}>Sau</button>
  </nav>;
}
