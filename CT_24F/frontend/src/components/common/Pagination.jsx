export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;
  return <div className="mt-4 flex items-center gap-3"><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={meta.current_page === 1} onClick={() => onPageChange(meta.current_page - 1)}>Trước</button><span>Trang {meta.current_page} / {meta.last_page}</span><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={meta.current_page === meta.last_page} onClick={() => onPageChange(meta.current_page + 1)}>Sau</button></div>;
}
