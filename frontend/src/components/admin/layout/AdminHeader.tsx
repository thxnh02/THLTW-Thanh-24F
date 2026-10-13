"use client";

import Link from "next/link";
import { LogOut, Menu, Store, X } from "lucide-react";

import { useStoreSettings } from "@/context/StoreSettingsContext";
import type { User } from "@/types/api";

export function roleLabel(role: User["role"]): string {
  return { admin: "Quản trị viên", manager: "Quản lý", staff: "Nhân viên", member: "Thành viên" }[role] ?? role;
}

type AdminHeaderProps = {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  user: User;
  onLogout: () => void;
};

export function AdminHeader({ isSidebarOpen, onToggleSidebar, user, onLogout }: AdminHeaderProps) {
  const settings = useStoreSettings();

  return (
    <header className="h-16 shrink-0 border-b border-slate-200 bg-white">
      <div className="flex h-full items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onToggleSidebar} className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden" aria-label={isSidebarOpen ? "Đóng menu quản trị" : "Mở menu quản trị"} aria-expanded={isSidebarOpen}>
            {isSidebarOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
          </button>
          <Link href="/admin" className="flex min-w-0 items-center gap-2 font-bold text-slate-950">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-xs font-black text-white">N</span>
            <span className="truncate">{settings.store_name} <span className="font-normal text-slate-400">/ Quản trị</span></span>
          </Link>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden text-right sm:block"><strong className="block text-slate-950">{user.name}</strong><span className="text-xs text-slate-500">{roleLabel(user.role)}</span></span>
          <Link href="/" className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:border-teal-500 sm:h-10 sm:w-auto sm:px-3" title="Xem cửa hàng">
            <Store size={17} aria-hidden="true" /><span className="ml-2 hidden sm:inline">Xem cửa hàng</span>
          </Link>
          <button type="button" onClick={onLogout} className="inline-flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white sm:h-10 sm:w-auto sm:px-3" title="Đăng xuất">
            <LogOut size={17} aria-hidden="true" /><span className="ml-2 hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
}
