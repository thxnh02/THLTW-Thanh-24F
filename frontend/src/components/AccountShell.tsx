"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";

const links = [
  ["Tổng quan", "/account/profile"],
  ["Hồ sơ", "/account/profile"],
  ["Địa chỉ", "/account/addresses"],
  ["Đơn hàng", "/account/orders"],
  ["Đổi trả", "/account/returns"],
  ["Yêu thích", "/wishlist"],
  ["Thông báo", "/account/notifications"],
  ["Đổi mật khẩu", "/account/change-password"],
] as const;

export function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const settings = useStoreSettings();

  if (!ready) return <main className="mx-auto max-w-7xl px-4 py-12"><div className="h-8 w-48 animate-pulse rounded bg-slate-200" /><div className="mt-6 h-64 animate-pulse rounded-lg bg-slate-200" /></main>;
  if (!user) return <main className="mx-auto max-w-md px-4 py-12"><section className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm"><h1 className="text-xl font-bold">Vui lòng đăng nhập</h1><p className="mt-2 text-sm text-slate-600">Đăng nhập để xem thông tin tài khoản và đơn hàng.</p><Link href="/login" className="mt-5 inline-flex min-h-11 items-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white">Đăng nhập</Link></section></main>;

  return <div className="mx-auto max-w-7xl px-4 py-8"><div className="mb-7"><p className="text-sm font-bold uppercase tracking-wider text-teal-700">Tài khoản</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Xin chào, {user.name}</h1><p className="mt-2 text-sm text-slate-600">Quản lý thông tin cá nhân, địa chỉ và các đơn hàng của bạn.</p></div><div className="grid gap-6 lg:grid-cols-[230px_1fr]"><aside className="h-fit rounded-lg border border-slate-200 bg-white p-3 shadow-sm"><p className="border-b border-slate-200 px-3 pb-3 text-sm font-semibold text-slate-500">{settings.store_name || "Công Nghệ Việt"}</p><nav className="mt-2 grid gap-1" aria-label="Điều hướng tài khoản">{links.filter(([label]) => label !== "Tổng quan").map(([label, href]) => { const active = pathname === href || (href !== "/account/profile" && pathname.startsWith(href)); return <Link key={href} href={href} className={`rounded-md px-3 py-3 text-sm font-semibold ${active ? "bg-teal-50 text-teal-900" : "text-slate-700 hover:bg-slate-100"}`}>{label}</Link>; })}</nav></aside><div className="min-w-0">{children}</div></div></div>;
}
