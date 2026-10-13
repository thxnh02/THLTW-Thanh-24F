"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;
export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) { return <TabsPrimitive.List className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1", className)} {...props} />; }
export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) { return <TabsPrimitive.Trigger className={cn("min-h-10 shrink-0 rounded-lg px-4 text-sm font-semibold text-slate-600 outline-none transition hover:text-slate-950 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm focus-visible:ring-2 focus-visible:ring-teal-600", className)} {...props} />; }
