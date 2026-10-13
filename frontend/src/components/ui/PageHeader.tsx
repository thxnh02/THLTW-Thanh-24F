import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6"><div>{eyebrow ? <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{eyebrow}</p> : null}<h1 className="text-3xl font-black tracking-normal text-slate-950">{title}</h1>{description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}</div>{action}</div>;
}
