import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-slate-950 text-white hover:bg-teal-800 disabled:bg-slate-300",
  secondary: "border border-slate-300 bg-white text-slate-900 hover:border-teal-700 hover:text-teal-800 disabled:bg-slate-100",
  quiet: "bg-slate-100 text-slate-900 hover:bg-slate-200 disabled:text-slate-400",
  danger: "bg-red-700 text-white hover:bg-red-800 disabled:bg-slate-300",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={`inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed ${buttonStyles[variant]} ${className}`} {...props} />;
}

export function IconButton({ label, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button aria-label={label} title={label} className={`inline-flex size-11 items-center justify-center rounded-md border border-slate-300 bg-white text-lg text-slate-900 transition hover:border-teal-700 hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-600/20 ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-600/20 ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-600/20 ${className}`} {...props} />;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "brand" | "success" | "warning" | "danger" }) {
  const tones = { neutral: "bg-slate-100 text-slate-700", brand: "bg-teal-50 text-teal-800", success: "bg-emerald-50 text-emerald-800", warning: "bg-amber-50 text-amber-800", danger: "bg-red-50 text-red-800" };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function SectionCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div>{eyebrow ? <p className="mb-2 text-xs font-bold uppercase tracking-wider text-teal-700">{eyebrow}</p> : null}<h1 className="text-3xl font-bold tracking-normal text-slate-950">{title}</h1>{description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}</div>{action}</div>;
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><p className="text-lg font-semibold text-slate-950">{title}</p><p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{message}</p>{action ? <div className="mt-5">{action}</div> : null}</div>;
}

export function ErrorState({ title = "Đã xảy ra lỗi", message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center"><p className="font-semibold text-red-900">{title}</p><p className="mt-2 text-sm text-red-800">{message}</p>{onRetry ? <Button variant="secondary" className="mt-5" onClick={onRetry}>Thử lại</Button> : null}</div>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-slate-200 ${className}`} />;
}
