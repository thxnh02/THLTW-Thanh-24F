import type { SelectHTMLAttributes } from "react";

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus-visible:border-teal-700 focus-visible:ring-2 focus-visible:ring-teal-600/20 ${className}`} {...props} />;
}
