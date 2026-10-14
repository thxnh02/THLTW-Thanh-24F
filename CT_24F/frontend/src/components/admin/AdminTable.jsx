/**
 * Accessible paginated table primitive.
 * @param {{columns: Array<{key: string, label: string, render?: (row: object) => React.ReactNode}>, data: object[], loading?: boolean, error?: string|Error, emptyMessage?: string, renderActions?: (row: object) => React.ReactNode, onRetry?: () => void}} props
 */
export default function AdminTable({
  columns,
  data = [],
  renderActions,
  loading = false,
  error = null,
  emptyMessage = "No records found.",
  onRetry,
}) {
  const errorMessage = typeof error === "string" ? error : error?.response?.data?.message ?? error?.message;
  const columnCount = columns.length + (renderActions ? 1 : 0);

  return (
    <div aria-busy={loading} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {errorMessage && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          <span>{errorMessage}</span>
          {onRetry && <button className="min-h-11 rounded-lg px-3 font-semibold underline decoration-rose-300 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={onRetry} type="button">Try again</button>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
            <tr>
              {columns.map((column) => (
                <th className="px-4 py-3.5 font-semibold" key={column.key} scope="col">{column.label}</th>
              ))}
              {renderActions && <th className="px-4 py-3.5 font-semibold" scope="col">Actions</th>}
            </tr>
          </thead>
          <tbody aria-live="polite">
            {loading ? (
              Array.from({ length: 4 }, (_, row) => (
                <tr aria-label="Loading row" className="border-t border-slate-100" key={row}>
                  {Array.from({ length: columnCount }, (_, cell) => <td className="px-4 py-4" key={cell}><span className="block h-4 animate-pulse rounded bg-slate-100" /></td>)}
                </tr>
              ))
            ) : data.length ? (
              data.map((row) => (
                <tr className="border-t border-slate-100 transition-colors hover:bg-slate-50/70" key={row.id}>
                  {columns.map((column) => (
                    <td className="px-4 py-3.5 text-slate-700" key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
                  ))}
                  {renderActions && <td className="px-3 py-2"><div className="flex min-h-11 items-center gap-2 [&_a]:min-h-11 [&_button]:min-h-11">{renderActions(row)}</div></td>}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-12 text-center text-slate-500" colSpan={columnCount || 1}>{errorMessage ? "Unable to load records." : emptyMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
