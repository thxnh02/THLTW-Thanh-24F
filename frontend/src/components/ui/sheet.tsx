"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({ className, children, side = "left", ...props }: ComponentProps<typeof Dialog.Content> & { side?: "left" | "right"; children?: ReactNode }) {
  return <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45" /><Dialog.Content className={cn(`fixed inset-y-0 z-50 flex w-[min(90vw,24rem)] flex-col bg-white shadow-[var(--shadow-float)] outline-none ${side === "right" ? "right-0" : "left-0"}`, className)} {...props}>{children}<Dialog.Close className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-teal-600 hover:text-teal-700" aria-label="Đóng"><X size={18} aria-hidden="true" /></Dialog.Close></Dialog.Content></Dialog.Portal>;
}

export function SheetHeader({ className, ...props }: ComponentProps<"div">) { return <div className={cn("border-b border-slate-200 px-5 py-5 pr-14", className)} {...props} />; }
export function SheetTitle(props: ComponentProps<typeof Dialog.Title>) { return <Dialog.Title className="text-lg font-bold text-slate-950" {...props} />; }
