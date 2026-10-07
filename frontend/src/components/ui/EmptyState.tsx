import type { ReactNode } from "react";

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><p className="text-lg font-semibold text-slate-950">{title}</p><p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{message}</p>{action ? <div className="mt-5">{action}</div> : null}</div>;
}
