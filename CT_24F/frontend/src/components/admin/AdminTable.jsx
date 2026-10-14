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
  emptyMessage = "Không tìm thấy bản ghi nào.",
  onRetry,
  selectedIds,
  onSelectionChange,
}) {
  const errorMessage = typeof error === "string" ? error : error?.response?.data?.message ?? error?.message;
  const selectable = Array.isArray(selectedIds) && typeof onSelectionChange === "function";
  const columnCount = columns.length + (renderActions ? 1 : 0) + (selectable ? 1 : 0);
  const selected = new Set((selectedIds ?? []).map(String));
  const allVisibleSelected = data.length > 0 && data.every((row) => selected.has(String(row.id)));

  const selectVisibleRows = (checked) => {
    const visibleIds = new Set(data.map((row) => String(row.id)));
    const nextSelection = checked
      ? new Set([...selected, ...visibleIds])
      : new Set([...selected].filter((id) => !visibleIds.has(id)));
    onSelectionChange([...nextSelection]);
  };

  const toggleRow = (row, checked) => {
    const nextSelection = new Set(selected);
    if (checked) nextSelection.add(String(row.id));
    else nextSelection.delete(String(row.id));
    onSelectionChange([...nextSelection]);
  };

  return (
    <div aria-busy={loading} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {errorMessage && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          <span>{errorMessage}</span>
          {onRetry && <button className="min-h-11 rounded-lg px-3 font-semibold underline decoration-rose-300 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={onRetry} type="button">Thử lại</button>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
            <tr>
              {selectable && <th className="w-12 px-4 py-3.5" scope="col"><input aria-label="Chọn tất cả trên trang này" checked={allVisibleSelected} className="size-4 accent-indigo-700" disabled={loading || data.length === 0} onChange={(event) => selectVisibleRows(event.target.checked)} type="checkbox" /></th>}
              {columns.map((column) => (
                <th className="px-4 py-3.5 font-semibold" key={column.key} scope="col">{column.label}</th>
              ))}
              {renderActions && <th className="px-4 py-3.5 font-semibold" scope="col">Thao tác</th>}
            </tr>
          </thead>
          <tbody aria-live="polite">
            {loading ? (
              Array.from({ length: 4 }, (_, row) => (
                <tr aria-label="Đang tải dòng dữ liệu" className="border-t border-slate-100" key={row}>
                  {Array.from({ length: columnCount }, (_, cell) => <td className="px-4 py-4" key={cell}><span className="block h-4 animate-pulse rounded bg-slate-100" /></td>)}
                </tr>
              ))
            ) : data.length ? (
              data.map((row) => (
                <tr className="border-t border-slate-100 transition-colors hover:bg-slate-50/70" key={row.id}>
                  {selectable && <td className="px-4 py-3.5"><input aria-label={`Chọn ${row.name}`} checked={selected.has(String(row.id))} className="size-4 accent-indigo-700" disabled={loading} onChange={(event) => toggleRow(row, event.target.checked)} type="checkbox" /></td>}
                  {columns.map((column) => (
                    <td className="px-4 py-3.5 text-slate-700" key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
                  ))}
                  {renderActions && <td className="px-3 py-2"><div className="flex min-h-11 items-center gap-2 [&_a]:min-h-11 [&_button]:min-h-11">{renderActions(row)}</div></td>}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-12 text-center text-slate-500" colSpan={columnCount || 1}>{errorMessage ? "Không thể tải dữ liệu." : emptyMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
