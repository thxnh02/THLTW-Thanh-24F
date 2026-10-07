import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-slate-950 text-white hover:bg-teal-800 disabled:bg-slate-300",
  secondary: "border border-slate-300 bg-white text-slate-900 hover:border-teal-700 hover:text-teal-800 disabled:bg-slate-100",
  quiet: "bg-slate-100 text-slate-900 hover:bg-slate-200 disabled:text-slate-400",
  danger: "bg-red-700 text-white hover:bg-red-800 disabled:bg-slate-300",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${buttonStyles[variant]} ${className}`} {...props} />;
}
