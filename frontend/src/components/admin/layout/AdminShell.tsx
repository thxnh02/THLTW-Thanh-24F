"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { AdminHeader } from "@/components/admin/layout/AdminHeader";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";

const motionProps = { initial: { opacity: 0, x: -16 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -16 }, transition: { duration: 0.2 } };

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) router.push("/admin/login");
  }, [pathname, ready, router, user]);

  if (!ready || !user) return <main className="mx-auto max-w-7xl px-4 py-12 text-slate-700">Đang kiểm tra quyền truy cập...</main>;
  if (!["admin", "manager", "staff"].includes(user.role)) return <main className="mx-auto max-w-2xl px-4 py-12"><section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold text-slate-950">403</h1><p className="mt-2 text-slate-600">Tài khoản hiện tại không có quyền truy cập khu vực quản trị.</p><Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white">Về trang chủ</Link></section></main>;

  return <div className="h-dvh overflow-hidden bg-slate-100"><AdminHeader isSidebarOpen={open} onToggleSidebar={() => setOpen((value) => !value)} user={user} onLogout={() => void logout()} /><div className="relative flex h-[calc(100dvh-4rem)] overflow-hidden"><AnimatePresence>{open ? <motion.button key="backdrop" type="button" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" aria-label="Đóng menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /> : null}</AnimatePresence><AnimatePresence>{open ? <motion.aside key="mobile-sidebar" {...motionProps} className="fixed inset-y-16 left-0 z-50 w-[min(84vw,300px)] overflow-y-auto overscroll-contain border-r border-slate-800 bg-slate-950 p-3 lg:hidden"><AdminSidebar pathname={pathname} role={user.role} onNavigate={() => setOpen(false)} /></motion.aside> : null}</AnimatePresence><aside className="hidden h-full w-64 shrink-0 overflow-y-auto overscroll-contain border-r border-slate-800 bg-slate-950 p-3 lg:block"><AdminSidebar pathname={pathname} role={user.role} /></aside><main className="h-full min-w-0 flex-1 overflow-y-auto overscroll-contain">{children}</main></div></div>;
}
