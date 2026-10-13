"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };
type ToastContextValue = { success: (message: string) => void; error: (message: string) => void; info: (message: string) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const reducedMotion = useReducedMotion();
  const remove = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const push = useCallback((message: string, tone: Toast["tone"]) => { const id = Date.now() + Math.random(); setToasts((current) => [...current, { id, message, tone }].slice(-3)); window.setTimeout(() => remove(id), 4200); }, [remove]);
  const value = useMemo(() => ({ success: (message: string) => push(message, "success"), error: (message: string) => push(message, "error"), info: (message: string) => push(message, "info") }), [push]);
  const icons = { success: CheckCircle2, error: XCircle, info: Info };

  return <ToastContext value={value}>{children}<div className="pointer-events-none fixed inset-x-4 bottom-4 z-[80] grid justify-items-end gap-2 sm:left-auto sm:w-96" aria-live="polite" aria-atomic="true"><AnimatePresence>{toasts.map((toast) => { const Icon = icons[toast.tone]; const toneClass = toast.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-950" : toast.tone === "error" ? "border-red-200 bg-red-50 text-red-950" : "border-sky-200 bg-sky-50 text-sky-950"; return <motion.div key={toast.id} initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }} transition={{ duration: 0.2 }} className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border px-4 py-3 shadow-[var(--shadow-float)] ${toneClass}`}><Icon className="mt-0.5 shrink-0" size={18} aria-hidden="true" /><p className="flex-1 text-sm font-semibold leading-5">{toast.message}</p><button type="button" onClick={() => remove(toast.id)} className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg opacity-70 transition hover:bg-white/60 hover:opacity-100" aria-label="Đóng thông báo"><X size={16} aria-hidden="true" /></button></motion.div>; })}</AnimatePresence></div></ToastContext>;
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
