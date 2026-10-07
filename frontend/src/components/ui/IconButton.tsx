import type { ButtonHTMLAttributes } from "react";

export function IconButton({ label, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button aria-label={label} title={label} className={`inline-flex size-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-lg text-slate-900 transition active:scale-[0.98] hover:border-teal-700 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;
}
