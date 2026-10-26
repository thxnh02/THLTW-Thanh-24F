"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Trang xác nhận dùng cho các đường dẫn khôi phục riêng; `submit` chỉ chạy khi bấm nút xác nhận.
 * @param {{load: () => Promise<object>, recordLabel: (record: object) => string, warning: string, submit: (record: object) => Promise<object>, backHref: string, successHref?: string, title?: string, actionLabel?: string}} props
 */
export default function ConfirmActionPage({
  load,
  recordLabel,
  warning,
  submit,
  backHref,
  successHref,
  title = "Xác nhận thao tác",
  actionLabel = "Xác nhận",
}) {
  const router = useRouter();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let current = true;
    load().then((response) => {
      if (current) setRecord(response?.data?.data ?? response?.data ?? response);
    }).catch((requestError) => {
      if (current) setError(requestError?.response?.data?.message ?? "Không thể tải bản ghi.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [load]);

  // Gọi API khôi phục/xử lý bản ghi, sau đó hiển thị kết quả hoặc chuyển trang.
  const confirm = async () => {
    if (!record || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await submit(record);
      setSuccess(response?.data?.message ?? "Đã hoàn tất thao tác.");
      if (successHref) router.push(successHref);
    } catch (requestError) {
      setError(requestError?.response?.data?.message ?? "Không thể hoàn tất thao tác.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">Cần xác nhận</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
      </div>
      {loading ? <p aria-live="polite" className="animate-pulse rounded-lg bg-slate-100 p-4 text-slate-500">Đang tải bản ghi…</p> : !record && !error ? <p className="rounded-lg bg-slate-50 p-4 text-slate-600">Không tìm thấy bản ghi.</p> : record && (
        <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:p-5">
          <p className="font-semibold text-slate-900">{recordLabel(record)}</p>
          <p className="text-sm leading-6 text-rose-900">{warning}</p>
        </div>
      )}
      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</p>}
      {success && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{success}</p>}
      <div className="flex flex-wrap gap-3">
        <Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href={backHref}>Hủy</Link>
        <button className="inline-flex min-h-11 items-center rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={loading || !record || submitting} onClick={confirm} type="button">{submitting ? "Đang xử lý…" : actionLabel}</button>
      </div>
    </main>
  );
}
