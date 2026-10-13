"use client";

import { Bell, Heart, MapPin, PackageCheck, RotateCcw, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useAuth } from "@/context/AuthContext";
import { useStoreSettings } from "@/context/StoreSettingsContext";

const links = [
  ["Hồ sơ", "/account/profile", UserRound],
  ["Địa chỉ", "/account/addresses", MapPin],
  ["Bảo mật", "/account/security", ShieldCheck],
  ["Đơn hàng", "/account/orders", PackageCheck],
  ["Đổi trả", "/account/returns", RotateCcw],
  ["Yêu thích", "/wishlist", Heart],
  ["Thông báo", "/account/notifications", Bell],
] as const;

export function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const settings = useStoreSettings();

  if (!ready) return <main className="page-shell py-12"><div className="h-8 w-48 animate-pulse rounded bg-slate-200" /><div className="mt-6 h-64 animate-pulse rounded-lg bg-slate-200" /></main>;
  if (!user) return <main className="page-shell max-w-md py-12"><section className="rounded-lg border border-[var(--border)] bg-white p-7 text-center shadow-[var(--shadow-card)]"><UserRound className="mx-auto text-teal-700" size={28} aria-hidden="true" /><h1 className="mt-3 text-xl font-bold">Vui lòng đăng nhập</h1><p className="mt-2 text-sm leading-6 text-slate-600">Đăng nhập để xem thông tin tài khoản và đơn hàng của bạn.</p><Link href="/login" className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-teal-700">Đăng nhập</Link></section></main>;

  return <main className="page-shell py-8 sm:py-10">
    <header className="mb-7 border-b border-[var(--border)] pb-6">
      <p className="text-sm font-bold uppercase tracking-[0.1em] text-teal-700">Tài khoản</p>
      <h1 className="mt-1 text-3xl font-black tracking-normal text-slate-950">Xin chào, {user.name}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Quản lý thông tin cá nhân, địa chỉ và các đơn hàng của bạn.</p>
    </header>
    <div className="grid gap-6 lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="h-fit rounded-lg border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-card)] lg:sticky lg:top-28">
        <p className="border-b border-[var(--border)] px-3 pb-3 text-sm font-semibold text-slate-500">{settings.store_name}</p>
        <nav className="mt-2 grid gap-1" aria-label="Điều hướng tài khoản">
          {links.map(([label, href, Icon]) => {
            const active = pathname === href || (href !== "/account/profile" && pathname.startsWith(href));
            return <Link key={href} href={href} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-teal-50 text-teal-900" : "text-slate-700 hover:bg-slate-100"}`}><Icon size={17} aria-hidden="true" />{label}</Link>;
          })}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  </main>;
}
