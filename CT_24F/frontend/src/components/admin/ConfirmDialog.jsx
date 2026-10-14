"use client";

import { useEffect, useRef, useState } from "react";

export default function ConfirmDialog({
  record,
  title,
  actionLabel,
  description,
  eyebrow = "Xác nhận thao tác",
  recordLabel,
  renderDescription,
  variant = "danger",
  requireAcknowledgement = false,
  acknowledgementLabel = "Tôi hiểu rằng không thể khôi phục sau khi xóa vĩnh viễn.",
  onConfirm,
  onDismiss,
  onComplete,
}) {
  const dialogRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [acknowledgedRecord, setAcknowledgedRecord] = useState(null);
  const acknowledged = Boolean(record && acknowledgedRecord === record);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (record && dialog && !dialog.open) dialog.showModal();
    if (!record && dialog?.open) dialog.close();
  }, [record]);

  const confirm = async () => {
    if (submitting || (requireAcknowledgement && !acknowledged)) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await onConfirm(record);
      setAcknowledgedRecord(null);
      dialogRef.current?.close();
      onComplete?.(record, result);
      onDismiss();
    } catch (requestError) {
      setError(requestError?.response?.data?.message ?? "Không thể thực hiện thao tác. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const dismiss = () => {
    if (submitting) return;
    setAcknowledgedRecord(null);
    setError("");
    onDismiss();
  };

  const confirmClass = variant === "primary"
    ? "bg-indigo-700 hover:bg-indigo-800"
    : "bg-rose-700 hover:bg-rose-800";

  return <dialog aria-labelledby="confirm-dialog-title" className="m-auto w-[min(92vw,30rem)] rounded-2xl p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50" onCancel={(event) => { event.preventDefault(); dismiss(); }} onClick={(event) => { if (event.target === dialogRef.current) dismiss(); }} onClose={dismiss} ref={dialogRef}>
    {record && <div className="space-y-5 p-6 sm:p-7">
      <div><p className={`text-xs font-bold uppercase tracking-[.15em] ${variant === "primary" ? "text-indigo-700" : "text-rose-700"}`}>{eyebrow}</p><h2 className="mt-2 text-xl font-semibold" id="confirm-dialog-title">{title}</h2></div>
      {renderDescription ? <div className="space-y-2"><p className="text-sm font-semibold text-slate-900">{recordLabel ? recordLabel(record) : record.name}</p>{renderDescription(record)}</div> : <p className="text-sm leading-6 text-slate-600">{description} <span className="font-semibold text-slate-900">{recordLabel ? recordLabel(record) : record.name}</span>?</p>}
      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</p>}
      {requireAcknowledgement && <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-900"><input checked={acknowledged} className="mt-0.5 size-4 shrink-0 accent-rose-700" onChange={(event) => setAcknowledgedRecord(event.target.checked ? record : null)} type="checkbox" /><span>{acknowledgementLabel}</span></label>}
      <div className="flex justify-end gap-3"><button autoFocus className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" disabled={submitting} onClick={dismiss} type="button">Hủy</button><button className={`min-h-11 rounded-lg px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${confirmClass}`} disabled={submitting || (requireAcknowledgement && !acknowledged)} onClick={confirm} type="button">{submitting ? "Đang xử lý…" : actionLabel}</button></div>
    </div>}
  </dialog>;
}
