"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Bell, ChevronDown, Heart, LogOut, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";
import { apiGetList, apiGetResponse } from "@/lib/api";
import type { CustomerNotification, User as UserType } from "@/types/api";

const staffRoles = ["admin", "manager", "staff"];
const navigation = [["Sản phẩm", "/products"], ["Bài viết", "/posts"], ["Liên hệ", "/contact"]] as const;
const motionProps = { initial: { opacity: 0, y: -8, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -8, scale: 0.98 }, transition: { duration: 0.18 } };

export function SiteHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { totalQuantity } = useCart();
  const settings = useStoreSettings();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    apiGetResponse<unknown[]>("/account/notifications?per_page=1").then(({ meta }) => setUnreadCount(Number(meta.unread_count ?? 0))).catch(() => undefined);
  }, [user]);

  async function toggleNotifications() {
    const nextOpen = !notificationOpen;
    setNotificationOpen(nextOpen);
    if (!nextOpen || notifications.length > 0) return;
    setNotificationLoading(true);
    try {
      setNotifications(await apiGetList<CustomerNotification>("/account/notifications?per_page=4"));
    } catch {
      setNotifications([]);
    } finally {
      setNotificationLoading(false);
    }
  }

  const storeName = settings.store_name;

  return <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur"><div className="bg-slate-950 text-xs text-slate-200"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2"><p><span className="font-bold text-teal-300">{storeName}</span><span className="mx-2 text-slate-500">·</span>Thiết bị công nghệ cho nhịp sống hiện đại</p><Link href="/posts" className="hidden font-semibold text-white hover:text-teal-300 sm:block">Góc công nghệ <span aria-hidden="true">→</span></Link></div></div><div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5 lg:gap-6"><button type="button" onClick={() => setMobileOpen((open) => !open)} className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 text-slate-900 hover:border-teal-500 md:hidden" aria-label={mobileOpen ? "Đóng menu" : "Mở menu"} aria-expanded={mobileOpen}>{mobileOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}</button><Link href="/" className="group flex min-w-0 shrink-0 items-center gap-2.5" aria-label={storeName}><span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-sm font-black text-white shadow-sm shadow-teal-600/20 transition group-hover:bg-slate-950">N</span><span className="max-w-36 truncate text-lg font-black tracking-tight text-slate-950 sm:max-w-none sm:text-xl">{storeName}</span></Link><nav className="hidden items-center gap-1 lg:flex" aria-label="Điều hướng chính">{navigation.map(([label, href]) => <Link key={href} href={href} className={`rounded-lg px-3 py-2 text-sm font-bold transition ${pathname.startsWith(href) ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>{label}</Link>)}</nav><form action="/search" className="ml-auto hidden min-w-0 flex-1 items-center lg:flex lg:max-w-md" role="search"><label className="sr-only" htmlFor="site-search">Tìm kiếm sản phẩm</label><input id="site-search" name="q" value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 min-w-0 flex-1 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white" placeholder="Tìm điện thoại, laptop..." /><button type="submit" className="inline-flex size-11 items-center justify-center rounded-r-xl bg-slate-950 text-white transition hover:bg-teal-700" aria-label="Tìm kiếm" title="Tìm kiếm"><Search size={18} aria-hidden="true" /></button></form><div className="ml-auto flex items-center gap-2 lg:ml-0"><Link href="/wishlist" className="hidden size-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-teal-500 hover:text-teal-700 sm:inline-flex" aria-label="Danh sách yêu thích" title="Danh sách yêu thích"><Heart size={18} aria-hidden="true" /></Link>{user ? <div className="relative hidden sm:block"><button type="button" onClick={() => void toggleNotifications()} className="relative inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 transition hover:border-teal-500" aria-label={`Thông báo, ${unreadCount} chưa đọc`} title="Thông báo" aria-expanded={notificationOpen} aria-haspopup="menu"><Bell size={18} aria-hidden="true" />{unreadCount > 0 ? <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}</button><AnimatePresence>{notificationOpen ? <NotificationMenu key="notifications" loading={notificationLoading} notifications={notifications} /> : null}</AnimatePresence></div> : null}<Link href="/cart" className="relative inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 transition hover:border-teal-500" aria-label={`Giỏ hàng, ${totalQuantity} sản phẩm`} title="Giỏ hàng"><ShoppingCart size={18} aria-hidden="true" />{totalQuantity > 0 ? <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-teal-600 px-1 text-[11px] font-bold text-white">{totalQuantity > 99 ? "99+" : totalQuantity}</span> : null}</Link>{user ? <div className="relative hidden sm:block"><button type="button" onClick={() => setAccountOpen((open) => !open)} className="inline-flex min-h-11 max-w-48 items-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-900 transition hover:bg-teal-50" aria-expanded={accountOpen} aria-haspopup="menu"><HeaderAvatar user={user} /><span className="max-w-28 truncate">{user.name}</span><ChevronDown size={16} aria-hidden="true" /></button><AnimatePresence>{accountOpen ? <AccountMenu key="account" user={user} logout={logout} /> : null}</AnimatePresence></div> : <Link href="/login" className="hidden min-h-11 items-center rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-teal-700 sm:inline-flex"><User size={16} className="mr-2" aria-hidden="true" />Đăng nhập</Link>}</div></div><div className="border-t border-slate-100 px-4 py-2.5 lg:hidden"><form action="/search" className="mx-auto flex max-w-7xl items-center" role="search"><label className="sr-only" htmlFor="mobile-search">Tìm kiếm sản phẩm</label><input id="mobile-search" name="q" value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 min-w-0 flex-1 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm" placeholder="Tìm sản phẩm..." /><button type="submit" className="size-10 rounded-r-xl bg-slate-950 text-white" aria-label="Tìm kiếm"><Search size={17} className="mx-auto" aria-hidden="true" /></button></form></div><AnimatePresence>{mobileOpen ? <motion.nav key="mobile-nav" {...motionProps} className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden" aria-label="Điều hướng di động"><div className="mx-auto grid max-w-7xl gap-1">{navigation.map(([label, href]) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 font-bold hover:bg-slate-50">{label}</Link>)}<Link href="/wishlist" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 font-bold hover:bg-slate-50">Danh sách yêu thích</Link>{user ? <><Link href="/account/profile" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 font-bold hover:bg-slate-50">Tài khoản của tôi</Link><Link href="/account/orders" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 font-bold hover:bg-slate-50">Đơn hàng</Link>{staffRoles.includes(user.role) ? <Link href="/admin" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 font-bold hover:bg-slate-50">Quản trị</Link> : null}<button type="button" onClick={() => void logout()} className="rounded-lg px-3 py-3 text-left font-bold text-red-700 hover:bg-red-50">Đăng xuất</button></> : <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-xl bg-slate-950 px-3 py-3 text-center font-bold text-white">Đăng nhập</Link>}</div></motion.nav> : null}</AnimatePresence></header>;
}

function NotificationMenu({ loading, notifications }: { loading: boolean; notifications: CustomerNotification[] }) {
  return <motion.div {...motionProps} className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl" role="menu"><div className="flex items-center justify-between gap-3"><p className="font-bold text-slate-950">Thông báo</p><Link href="/account/notifications" className="text-xs font-bold text-teal-800" role="menuitem">Xem tất cả</Link></div>{loading ? <p className="py-5 text-sm text-slate-600">Đang tải thông báo...</p> : notifications.length === 0 ? <p className="py-5 text-sm text-slate-600">Chưa có thông báo mới.</p> : <div className="mt-2 divide-y divide-slate-100">{notifications.map((item) => <Link key={item.id} href={item.action_url || "/account/notifications"} className={`block py-3 text-sm hover:bg-slate-50 ${item.read_at ? "opacity-70" : ""}`} role="menuitem"><p className="font-semibold text-slate-950">{item.title}</p><p className="mt-1 line-clamp-2 text-slate-600">{item.message}</p></Link>)}</div>}</motion.div>;
}

function AccountMenu({ user, logout }: { user: UserType; logout: () => Promise<void> }) {
  return <motion.div {...motionProps} className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl" role="menu"><Link href="/account/profile" className="block rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50" role="menuitem">Tài khoản</Link><Link href="/account/security" className="block rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50" role="menuitem">Bảo mật</Link><Link href="/account/orders" className="block rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50" role="menuitem">Đơn hàng</Link><Link href="/account/addresses" className="block rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50" role="menuitem">Địa chỉ</Link>{staffRoles.includes(user.role) ? <Link href="/admin" className="block rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50" role="menuitem">Quản trị</Link> : null}<button type="button" onClick={() => void logout()} className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-slate-200 px-3 py-2.5 text-left text-sm font-semibold text-red-700 hover:bg-red-50" role="menuitem"><LogOut size={16} aria-hidden="true" />Đăng xuất</button></motion.div>;
}

function HeaderAvatar({ user }: { user: UserType }) {
  return user.avatar_url ? <Image src={user.avatar_url} alt="" width={28} height={28} unoptimized className="size-7 rounded-full object-cover" /> : <span className="inline-flex size-7 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-900" aria-hidden="true">{user.name.split(" ").filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase()}</span>;
}
