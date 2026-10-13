"use client";

export default function ConfirmDialog({ title, message, error, busy, onCancel, onConfirm }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#10231f]/45 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <section aria-labelledby="confirm-title" aria-modal="true" className="w-full max-w-md rounded-[1.5rem] border border-white/70 bg-white p-6 shadow-2xl" role="alertdialog">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-lg text-red-600">!</span>
      <h2 className="mt-4 text-lg font-semibold text-slate-900" id="confirm-title">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex justify-end gap-2"><button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50" disabled={busy} onClick={onCancel} type="button">Giữ lại</button><button className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50" disabled={busy} onClick={onConfirm} type="button">{busy ? "Đang xóa..." : "Xác nhận xóa"}</button></div>
    </section>
  </div>;
}
