"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogAction = AlertDialogPrimitive.Action;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogTitle = AlertDialogPrimitive.Title;
export const AlertDialogDescription = AlertDialogPrimitive.Description;
export function AlertDialogContent({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Content>) { return <AlertDialogPrimitive.Portal><AlertDialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-slate-950/45" /><AlertDialogPrimitive.Content className={cn("fixed left-1/2 top-1/2 z-[71] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-[var(--shadow-float)] outline-none", className)} {...props} /></AlertDialogPrimitive.Portal>; }
