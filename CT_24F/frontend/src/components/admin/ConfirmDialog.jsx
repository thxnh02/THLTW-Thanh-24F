"use client";

import { useEffect, useRef, useState } from "react";

export default function ConfirmDialog({ record, title, actionLabel, description, onConfirm, onDismiss, onComplete }) {
  const dialogRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (record && dialog && !dialog.open) dialog.showModal();
    if (!record && dialog?.open) dialog.close();
  }, [record]);

  const confirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await onConfirm(record);
      dialogRef.current?.close();
      onComplete?.();
      onDismiss();
    } catch (requestError) {
      setError(requestError?.response?.data?.message ?? "Không thể thực hiện thao tác. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return <dialog aria-labelledby="confirm-dialog-title" className="m-auto w-[min(92vw,30rem)] rounded-2xl p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50" onCancel={(event) => { event.preventDefault(); if (!submitting) onDismiss(); }} onClick={(event) => { if (event.target === dialogRef.current && !submitting) onDismiss(); }} onClose={onDismiss} ref={dialogRef}>
    {record && <div className="space-y-5 p-6 sm:p-7">
      <div><p className="text-xs font-bold uppercase tracking-[.15em] text-rose-700">Xác nhận thao tác</p><h2 className="mt-2 text-xl font-semibold" id="confirm-dialog-title">{title}</h2></div>
      <p className="text-sm leading-6 text-slate-600">{description} <span className="font-semibold text-slate-900">{record.name}</span>?</p>
      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</p>}
      <div className="flex justify-end gap-3"><button autoFocus className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" disabled={submitting} onClick={onDismiss} type="button">Hủy</button><button className="min-h-11 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50" disabled={submitting} onClick={confirm} type="button">{submitting ? "Đang xử lý…" : actionLabel}</button></div>
    </div>}
  </dialog>;
}
