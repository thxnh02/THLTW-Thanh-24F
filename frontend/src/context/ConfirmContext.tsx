"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, Button } from "@/components/ui";

type ConfirmOptions = { title: string; message: string; confirmLabel?: string };
type PendingConfirm = ConfirmOptions & { resolve: (value: boolean) => void };
const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })), []);
  const value = useMemo(() => confirm, [confirm]);
  function close(result: boolean) { pending?.resolve(result); setPending(null); }

  return <ConfirmContext value={value}>{children}<AlertDialog open={Boolean(pending)} onOpenChange={(open) => { if (!open) close(false); }}><AlertDialogContent><AlertDialogTitle className="text-lg font-bold text-slate-950">{pending?.title}</AlertDialogTitle><AlertDialogDescription className="mt-2 text-sm leading-6 text-slate-600">{pending?.message}</AlertDialogDescription><div className="mt-6 flex justify-end gap-3"><AlertDialogCancel asChild><Button type="button" variant="secondary" onClick={() => close(false)}>Hủy</Button></AlertDialogCancel><AlertDialogAction asChild><Button type="button" variant="danger" onClick={() => close(true)}>{pending?.confirmLabel ?? "Xác nhận"}</Button></AlertDialogAction></div></AlertDialogContent></AlertDialog></ConfirmContext>;
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used inside ConfirmProvider");
  return context;
}
