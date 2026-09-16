"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
};

type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    setPending({ ...options, resolve });
  }), []);

  const value = useMemo(() => confirm, [confirm]);

  function close(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  return (
    <ConfirmContext value={value}>
      {children}
      {pending ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
          <section className="w-full max-w-md rounded-md bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-950">{pending.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{pending.message}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => close(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
                Huy
              </button>
              <button type="button" onClick={() => close(true)} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                {pending.confirmLabel ?? "Xac nhan"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </ConfirmContext>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error("useConfirm must be used inside ConfirmProvider");
  }

  return context;
}
