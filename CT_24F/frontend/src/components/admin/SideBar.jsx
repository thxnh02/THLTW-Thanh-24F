"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, Building2, LayoutDashboard, Package, Store } from "lucide-react";

const links = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/category", label: "Danh mục", icon: Boxes },
  { href: "/admin/brand", label: "Thương hiệu", icon: Building2 },
  { href: "/admin/product", label: "Sản phẩm", icon: Package },
  { href: "/", label: "Xem cửa hàng", icon: Store },
];

export default function SideBar({ mobile = false, onNavigate }) {
  const pathname = usePathname() ?? "/admin";
  return <div className={`flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain bg-[#101a2b] text-white ${mobile ? "px-4 py-5" : "px-4 py-6"}`}>
    <Link aria-label="CT_24F admin dashboard" className="mb-8 flex items-center gap-3 rounded-xl px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300" href="/admin" onClick={onNavigate}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-400 font-serif text-xl font-semibold text-slate-950">C</span>
      <span><span className="block text-sm font-bold tracking-[.12em]">CT_24F</span><span className="mt-0.5 block text-[9px] font-medium tracking-[.18em] text-slate-400">QUẢN TRỊ CỬA HÀNG</span></span>
    </Link>
    <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">Không gian quản trị</p>
    <nav aria-label="Admin sections" className="space-y-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : href !== "/" && pathname.startsWith(href);
        return <Link aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 ${active ? "bg-indigo-400/15 text-indigo-200 ring-1 ring-inset ring-indigo-300/20" : "text-slate-300 hover:bg-white/8 hover:text-white"}`} href={href} key={href} onClick={onNavigate}>
          <Icon aria-hidden="true" size={18} strokeWidth={1.8} /><span>{label}</span>
        </Link>;
      })}
    </nav>
    <div className="mt-auto rounded-xl border border-white/10 bg-white/[.04] p-4 text-xs leading-5 text-slate-400">Quản lý cửa hàng<br /><span className="text-indigo-200">Danh mục · Thương hiệu · Sản phẩm</span></div>
  </div>;
}
