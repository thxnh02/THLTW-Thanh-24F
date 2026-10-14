import AdminTable from "@/components/admin/AdminTable";

/** @param {{columns: Array, data: object[], meta?: {current_page?: number, last_page?: number, total?: number}, loading?: boolean, error?: string|Error, emptyMessage?: string, renderActions?: (row: object) => React.ReactNode, onPageChange?: (page: number) => void, onRetry?: () => void}} props */
export default function TrashTable({
  columns,
  data,
  meta,
  loading,
  error,
  emptyMessage = "The trash is empty.",
  renderActions,
  onPageChange,
  onRetry,
}) {
  const page = meta?.current_page ?? 1;
  const lastPage = meta?.last_page ?? 1;

  return (
    <section className="space-y-4">
      <AdminTable columns={columns} data={data} emptyMessage={emptyMessage} error={error} loading={loading} onRetry={onRetry} renderActions={renderActions} />
      {meta && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <p aria-live="polite">Page {page} of {lastPage} · {meta.total ?? data.length} deleted records</p>
          <div className="flex gap-2">
            <button aria-label="Previous trash page" className="min-h-11 rounded-lg border border-slate-200 px-3 font-medium hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40" disabled={loading || page <= 1} onClick={() => onPageChange?.(page - 1)} type="button">Previous</button>
            <button aria-label="Next trash page" className="min-h-11 rounded-lg border border-slate-200 px-3 font-medium hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40" disabled={loading || page >= lastPage} onClick={() => onPageChange?.(page + 1)} type="button">Next</button>
          </div>
        </div>
      )}
    </section>
  );
}
