import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus-visible:border-teal-700 focus-visible:ring-2 focus-visible:ring-teal-600/20 ${className}`} {...props} />;
}
