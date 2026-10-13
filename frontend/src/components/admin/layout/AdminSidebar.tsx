"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { adminNavigation } from "@/data/adminNavigation";
import { canSee } from "@/lib/admin/adminPermissions";
import type { User } from "@/types/api";

type AdminSidebarProps = {
  pathname: string;
  role: User["role"];
  onNavigate?: () => void;
};

export function AdminSidebar({ pathname, role, onNavigate }: AdminSidebarProps) {
  return (
    <nav className="grid gap-5" aria-label="Điều hướng quản trị">
      {adminNavigation.map((group) => {
        const items = group.items.filter((item) => canSee(role, item.permission));
        if (!items.length) return null;

        return (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{group.label}</p>
            <div className="grid gap-1">
              {items.map((item) => {
                const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={onNavigate} className={`group flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${active ? "bg-teal-600 text-white shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
                    <Icon size={17} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {active ? <ChevronRight size={15} aria-hidden="true" /> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
