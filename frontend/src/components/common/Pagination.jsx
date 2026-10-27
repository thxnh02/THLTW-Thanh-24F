// Nhận meta phân trang từ API; bấm Trước/Sau sẽ gọi load(page) của trang cha.
export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;
  return <nav aria-label="Phân trang" className="mt-4 flex flex-wrap items-center gap-3">
    <button aria-label="Trang trước" className="min-h-11 rounded-xl border border-[#d8e2da] bg-white px-4 text-sm font-medium text-[#29483f] transition hover:border-[#90b4a0] hover:text-[#193f36] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#37665b] disabled:cursor-not-allowed disabled:opacity-40" disabled={meta.current_page === 1} onClick={() => onPageChange(meta.current_page - 1)}>Trước</button>
    <span aria-current="page" className="text-sm text-slate-600">Trang {meta.current_page} / {meta.last_page}</span>
    <button aria-label="Trang sau" className="min-h-11 rounded-xl border border-[#d8e2da] bg-white px-4 text-sm font-medium text-[#29483f] transition hover:border-[#90b4a0] hover:text-[#193f36] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#37665b] disabled:cursor-not-allowed disabled:opacity-40" disabled={meta.current_page === meta.last_page} onClick={() => onPageChange(meta.current_page + 1)}>Sau</button>
  </nav>;
}
