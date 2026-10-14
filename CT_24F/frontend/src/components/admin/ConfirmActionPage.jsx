"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Dedicated confirmation screen. `submit` is only called after the explicit button press.
 * @param {{load: () => Promise<object>, recordLabel: (record: object) => string, warning: string, submit: (record: object) => Promise<object>, backHref: string, successHref?: string, title?: string, actionLabel?: string}} props
 */
export default function ConfirmActionPage({
  load,
  recordLabel,
  warning,
  submit,
  backHref,
  successHref,
  title = "Confirm this action",
  actionLabel = "Confirm",
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
      if (current) setError(requestError?.response?.data?.message ?? "This record could not be loaded.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [load]);

  const confirm = async () => {
    if (!record || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await submit(record);
      setSuccess(response?.data?.message ?? "Action completed.");
      if (successHref) router.push(successHref);
    } catch (requestError) {
      setError(requestError?.response?.data?.message ?? "The action could not be completed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">Confirmation required</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
      </div>
      {loading ? <p aria-live="polite" className="animate-pulse rounded-lg bg-slate-100 p-4 text-slate-500">Loading record…</p> : !record && !error ? <p className="rounded-lg bg-slate-50 p-4 text-slate-600">Record not found.</p> : record && (
        <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:p-5">
          <p className="font-semibold text-slate-900">{recordLabel(record)}</p>
          <p className="text-sm leading-6 text-rose-900">{warning}</p>
        </div>
      )}
      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</p>}
      {success && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{success}</p>}
      <div className="flex flex-wrap gap-3">
        <Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href={backHref}>Cancel</Link>
        <button className="inline-flex min-h-11 items-center rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={loading || !record || submitting} onClick={confirm} type="button">{submitting ? "Working…" : actionLabel}</button>
      </div>
    </main>
  );
}
