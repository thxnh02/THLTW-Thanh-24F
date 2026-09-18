"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";

const navItems = [
  ["Tổng quan", "/admin", "dashboard"],
  ["Danh mục", "/admin/categories", "catalog"],
  ["Thương hiệu", "/admin/brands", "catalog"],
  ["Sản phẩm", "/admin/products", "catalog"],
  ["Đơn hàng", "/admin/orders", "orders"],
  ["Đổi trả", "/admin/returns", "returns"],
  ["Thành viên", "/admin/users", "users"],
  ["Khuyến mãi", "/admin/promotions", "promotions"],
  ["Vận chuyển", "/admin/shipping-methods", "shipping"],
  ["Báo cáo", "/admin/reports", "reports"],
  ["Nhập CSV", "/admin/import/products", "catalog"],
  ["Bài viết", "/admin/posts", "content"],
  ["Chủ đề", "/admin/post-categories", "content"],
  ["Trang", "/admin/pages", "content"],
  ["Menu", "/admin/menus", "content"],
  ["Banner", "/admin/banners", "content"],
  ["Liên hệ", "/admin/contacts", "contacts"],
  ["Kho", "/admin/stock", "stock"],
  ["Thư viện ảnh", "/admin/media", "content"],
  ["Cấu hình", "/admin/settings", "settings"],
] as const;

const rolePermissions: Record<string, string[]> = {
  admin: ["*"],
  manager: ["dashboard", "reports", "catalog", "promotions", "orders", "returns", "shipping", "stock", "content", "contacts"],
  staff: ["orders", "returns", "stock", "contacts"],
};

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const settings = useStoreSettings();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      return;
    }

    if (ready && !user) {
      router.push("/admin/login");
    }
  }, [pathname, ready, router, user]);

  if (pathname === "/admin/login") {
    return children;
  }

  if (!ready || !user) {
    return <main className="mx-auto max-w-7xl px-4 py-12 text-slate-700">Đang kiểm tra quyền truy cập...</main>;
  }

  if (!["admin", "manager", "staff"].includes(user.role)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">403</h1>
          <p className="mt-2 text-slate-600">Tài khoản hiện tại không có quyền truy cập khu vực quản trị.</p>
          <Link href="/" className="mt-5 inline-block rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
            Về trang chủ
          </Link>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold lg:hidden">
              ☰
            </button>
            <Link href="/admin" className="font-bold text-slate-950">
              {settings.store_name || "Công Nghệ Việt"} · Quản trị
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden text-right sm:block"><strong className="block text-slate-950">{user.name}</strong><span className="text-xs text-slate-500">{roleLabel(user.role)}</span></span>
            <Link href="/" className="rounded-md border border-slate-300 px-3 py-2 font-semibold">
              Xem cửa hàng
            </Link>
            <button type="button" onClick={() => logout()} className="rounded-md bg-slate-950 px-3 py-2 font-semibold text-white">
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[240px_1fr]">
        <aside className={`${open ? "block" : "hidden"} border-r border-slate-200 bg-white p-3 lg:block`}>
          <nav className="grid gap-1">
            {navItems.filter(([, , permission]) => canSee(user.role, permission)).map(([label, href]) => {
              const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-semibold ${active ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

function canSee(role: string, permission: string): boolean {
  const permissions = rolePermissions[role] ?? [];

  return permissions.includes("*") || permissions.includes(permission);
}

export function roleLabel(role: string): string {
  return { admin: "Quản trị viên", manager: "Quản lý", staff: "Nhân viên", member: "Thành viên" }[role] ?? role;
}
