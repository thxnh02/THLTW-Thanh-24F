"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { BarChart3, Boxes, ChevronRight, FileText, Image as ImageIcon, LayoutDashboard, LogOut, Menu, MessageSquare, Package, Percent, Settings, ShoppingBag, Store, Tags, Truck, Users, X, Upload, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";
import { canSee } from "@/lib/adminPermissions";

type NavItem = { label: string; href: string; permission: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  { label: "Tổng quan", items: [{ label: "Tổng quan", href: "/admin", permission: "dashboard", icon: LayoutDashboard }] },
  { label: "Thương mại", items: [{ label: "Sản phẩm", href: "/admin/products", permission: "catalog", icon: Package }, { label: "Danh mục", href: "/admin/categories", permission: "catalog", icon: Tags }, { label: "Thương hiệu", href: "/admin/brands", permission: "catalog", icon: Store }, { label: "Đơn hàng", href: "/admin/orders", permission: "orders", icon: ShoppingBag }, { label: "Đổi trả", href: "/admin/returns", permission: "returns", icon: RotateCcw }] },
  { label: "Vận hành", items: [{ label: "Kho", href: "/admin/stock", permission: "stock", icon: Boxes }, { label: "Vận chuyển", href: "/admin/shipping-methods", permission: "shipping", icon: Truck }, { label: "Nhập CSV", href: "/admin/import/products", permission: "catalog", icon: Upload }] },
  { label: "Khách hàng", items: [{ label: "Thành viên", href: "/admin/users", permission: "users", icon: Users }, { label: "Liên hệ", href: "/admin/contacts", permission: "contacts", icon: MessageSquare }] },
  { label: "Marketing", items: [{ label: "Khuyến mãi", href: "/admin/promotions", permission: "promotions", icon: Percent }] },
  { label: "Nội dung", items: [{ label: "Bài viết", href: "/admin/posts", permission: "content", icon: FileText }, { label: "Chủ đề", href: "/admin/post-categories", permission: "content", icon: Tags }, { label: "Trang", href: "/admin/pages", permission: "content", icon: FileText }, { label: "Menu", href: "/admin/menus", permission: "content", icon: LayoutDashboard }, { label: "Banner", href: "/admin/banners", permission: "content", icon: ImageIcon }, { label: "Thư viện ảnh", href: "/admin/media", permission: "content", icon: ImageIcon }] },
  { label: "Phân tích", items: [{ label: "Báo cáo", href: "/admin/reports", permission: "reports", icon: BarChart3 }] },
  { label: "Hệ thống", items: [{ label: "Cấu hình", href: "/admin/settings", permission: "settings", icon: Settings }] },
];

const motionProps = { initial: { opacity: 0, x: -16 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -16 }, transition: { duration: 0.2 } };

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const settings = useStoreSettings();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname !== "/admin/login" && ready && !user) router.push("/admin/login");
  }, [pathname, ready, router, user]);

  if (pathname === "/admin/login") return children;
  if (!ready || !user) return <main className="mx-auto max-w-7xl px-4 py-12 text-slate-700">Đang kiểm tra quyền truy cập...</main>;
  if (!["admin", "manager", "staff"].includes(user.role)) return <main className="mx-auto max-w-2xl px-4 py-12"><section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold text-slate-950">403</h1><p className="mt-2 text-slate-600">Tài khoản hiện tại không có quyền truy cập khu vực quản trị.</p><Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white">Về trang chủ</Link></section></main>;

  return <div className="min-h-screen bg-slate-100"><header className="sticky top-0 z-40 border-b border-slate-200 bg-white"><div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6"><div className="flex min-w-0 items-center gap-3"><button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden" aria-label={open ? "Đóng menu quản trị" : "Mở menu quản trị"} aria-expanded={open}>{open ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}</button><Link href="/admin" className="flex min-w-0 items-center gap-2 font-bold text-slate-950"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-xs font-black text-white">N</span><span className="truncate">{settings.store_name} <span className="font-normal text-slate-400">/ Quản trị</span></span></Link></div><div className="flex items-center gap-2 text-sm"><span className="hidden text-right sm:block"><strong className="block text-slate-950">{user.name}</strong><span className="text-xs text-slate-500">{roleLabel(user.role)}</span></span><Link href="/" className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:border-teal-500 sm:h-10 sm:w-auto sm:px-3" title="Xem cửa hàng"><Store size={17} aria-hidden="true" /><span className="ml-2 hidden sm:inline">Xem cửa hàng</span></Link><button type="button" onClick={() => void logout()} className="inline-flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white sm:h-10 sm:w-auto sm:px-3" title="Đăng xuất"><LogOut size={17} aria-hidden="true" /><span className="ml-2 hidden sm:inline">Đăng xuất</span></button></div></div></header><div className="mx-auto flex max-w-[1500px]"><AnimatePresence>{open ? <motion.button key="backdrop" type="button" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" aria-label="Đóng menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /> : null}</AnimatePresence><AnimatePresence>{open ? <motion.aside key="mobile-sidebar" {...motionProps} className="fixed inset-y-16 left-0 z-50 w-[min(84vw,300px)] overflow-y-auto border-r border-slate-800 bg-slate-950 p-3 lg:hidden"><SidebarNav pathname={pathname} role={user.role} close={() => setOpen(false)} /></motion.aside> : null}</AnimatePresence><aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-950 p-3 lg:block lg:min-h-[calc(100vh-4rem)] lg:overflow-y-auto"><SidebarNav pathname={pathname} role={user.role} close={() => setOpen(false)} /></aside><div className="min-w-0 flex-1 lg:min-h-[calc(100vh-4rem)] lg:overflow-y-auto">{children}</div></div></div>;
}

function SidebarNav({ pathname, role, close }: { pathname: string; role: string; close: () => void }) {
  return <nav className="grid gap-5" aria-label="Điều hướng quản trị">{navGroups.map((group) => { const items = group.items.filter((item) => canSee(role, item.permission)); if (!items.length) return null; return <div key={group.label}><p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{group.label}</p><div className="grid gap-1">{items.map((item) => { const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href); const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={close} className={`group flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${active ? "bg-teal-600 text-white shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}><Icon size={17} strokeWidth={active ? 2.4 : 2} aria-hidden="true" /><span className="min-w-0 flex-1 truncate">{item.label}</span>{active ? <ChevronRight size={15} aria-hidden="true" /> : null}</Link>; })}</div></div>; })}</nav>;
}

export function roleLabel(role: string): string { return { admin: "Quản trị viên", manager: "Quản lý", staff: "Nhân viên", member: "Thành viên" }[role] ?? role; }
