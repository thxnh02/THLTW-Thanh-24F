"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Store } from "lucide-react";

function sectionTitle(pathname) {
  if (pathname.startsWith("/admin/category")) return "Danh mục";
  if (pathname.startsWith("/admin/brand")) return "Thương hiệu";
  if (pathname.startsWith("/admin/product")) return "Sản phẩm";
  return "Tổng quan";
}

export default function Header({ menuButtonRef, menuOpen, onMenuClick }) {
  const pathname = usePathname() ?? "/admin";
  return <header className="sticky top-0 z-20 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
    <div className="flex min-w-0 items-center gap-3">
      <button aria-controls="admin-mobile-drawer" aria-expanded={menuOpen} aria-label={menuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:hidden" onClick={onMenuClick} ref={menuButtonRef} type="button"><Menu aria-hidden="true" size={20} /></button>
      <div className="min-w-0"><p className="hidden text-[10px] font-bold uppercase tracking-[.16em] text-indigo-700 sm:block">CT_24F · Quản trị</p><h1 className="truncate text-base font-semibold text-slate-950 sm:mt-0.5">{sectionTitle(pathname)}</h1></div>
    </div>
    <Link className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-4" href="/"><Store aria-hidden="true" size={17} /><span className="hidden sm:inline">Xem cửa hàng</span></Link>
  </header>;
}
