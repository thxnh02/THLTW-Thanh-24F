import AdminTable from "@/components/admin/AdminTable";

/** Bảng thùng rác dùng chung: hiển thị dòng đã xóa, ô chọn nhiều mục và phân trang. */
/** @param {{columns: Array, data: object[], meta?: {current_page?: number, last_page?: number, total?: number}, loading?: boolean, error?: string|Error, emptyMessage?: string, renderActions?: (row: object) => React.ReactNode, onPageChange?: (page: number) => void, onRetry?: () => void}} props */
export default function TrashTable({
  columns,
  data,
  meta,
  loading,
  error,
  emptyMessage = "Thùng rác đang trống.",
  renderActions,
  onPageChange,
  onRetry,
  selectedIds = [],
  onSelectionChange,
  bulkActions,
}) {
  const page = meta?.current_page ?? 1;
  const lastPage = meta?.last_page ?? 1;

  return (
    <section className="space-y-4">
      {selectedIds.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
        <p aria-live="polite" className="text-sm font-semibold text-indigo-950">{selectedIds.length} mục đã chọn</p>
        <div className="flex flex-wrap gap-2">{bulkActions}</div>
      </div>}
      <AdminTable columns={columns} data={data} emptyMessage={emptyMessage} error={error} loading={loading} onRetry={onRetry} onSelectionChange={onSelectionChange} renderActions={renderActions} selectedIds={selectedIds} />
      {meta && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <p aria-live="polite">Trang {page} / {lastPage} · {meta.total ?? data.length} mục đã xóa</p>
          <div className="flex gap-2">
            <button aria-label="Trang thùng rác trước" className="min-h-11 rounded-lg border border-slate-200 px-3 font-medium hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40" disabled={loading || page <= 1} onClick={() => onPageChange?.(page - 1)} type="button">Trước</button>
            <button aria-label="Trang thùng rác sau" className="min-h-11 rounded-lg border border-slate-200 px-3 font-medium hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40" disabled={loading || page >= lastPage} onClick={() => onPageChange?.(page + 1)} type="button">Sau</button>
          </div>
        </div>
      )}
    </section>
  );
}
