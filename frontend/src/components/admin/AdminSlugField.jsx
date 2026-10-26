// Slug tự theo tên ở form cha; nút này cho phép bật lại chế độ tự tạo sau khi sửa thủ công.
export default function AdminSlugField({ value, onChange, onReset, error, maxLength, manual }) {
  return <div className="space-y-1">
    <label className="admin-label" htmlFor="slug">Đường dẫn (slug)</label>
    <div className="flex flex-wrap gap-2 sm:flex-nowrap">
      <input aria-describedby={error ? "slug-error" : "slug-hint"} aria-invalid={Boolean(error)} className="admin-input min-w-0 flex-1" id="slug" maxLength={maxLength} name="slug" required value={value ?? ""} onChange={onChange} />
      <button className="min-h-11 rounded-xl border border-indigo-200 px-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50" type="button" onClick={onReset}>Tạo lại từ tên</button>
    </div>
    {error ? <small className="block text-rose-700" id="slug-error" role="alert">{error}</small> : <p className="text-xs text-slate-500" id="slug-hint">{manual ? "Slug đã chỉnh thủ công; đổi tên sẽ không ghi đè." : "Slug tự đổi theo tên, kể cả khi sửa."} Nếu trùng, hệ thống tự thêm -2, -3.</p>}
  </div>;
}
