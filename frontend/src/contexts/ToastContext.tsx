"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };
type ToastContextValue = { success: (message: string) => void; error: (message: string) => void; info: (message: string) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Toast["tone"]) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }].slice(-3));
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }, []);
  const value = useMemo(() => ({ success: (message: string) => push(message, "success"), error: (message: string) => push(message, "error"), info: (message: string) => push(message, "info") }), [push]);

  return <ToastContext value={value}><>{children}<div className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] grid justify-items-end gap-2 sm:left-auto sm:w-96" aria-live="polite" aria-atomic="true">{toasts.map((toast) => <div key={toast.id} className={`pointer-events-auto w-full rounded-md border px-4 py-3 text-sm font-semibold shadow-lg ${toast.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : toast.tone === "error" ? "border-red-200 bg-red-50 text-red-900" : "border-slate-200 bg-white text-slate-900"}`}>{toast.message}</div>)}</div></></ToastContext>;
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
