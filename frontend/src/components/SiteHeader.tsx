"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";
import { apiGetList, apiGetResponse } from "@/lib/api";
import type { CustomerNotification, User } from "@/types/api";

const staffRoles = ["admin", "manager", "staff"];

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
    if (!user) {
      return;
    }
    apiGetResponse<unknown[]>("/account/notifications?per_page=1")
      .then(({ meta }) => setUnreadCount(Number(meta.unread_count ?? 0)))
      .catch(() => undefined);
  }, [user]);

  async function toggleNotifications() {
    const nextOpen = !notificationOpen;
    setNotificationOpen(nextOpen);
    if (!nextOpen || notifications.length > 0) {
      return;
    }

    setNotificationLoading(true);
    try {
      setNotifications(await apiGetList<CustomerNotification>("/account/notifications?per_page=4"));
    } catch {
      setNotifications([]);
    } finally {
      setNotificationLoading(false);
    }
  }

  if (pathname.startsWith("/admin")) return null;

  const storeName = settings.store_name || "Công Nghệ Việt";
  const navigation = [["Sản phẩm", "/products"], ["Bài viết", "/posts"], ["Liên hệ", "/contact"]];

  return <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
      <button type="button" onClick={() => setMobileOpen((open) => !open)} className="inline-flex size-11 items-center justify-center rounded-md border border-slate-300 text-xl text-slate-900 md:hidden" aria-label={mobileOpen ? "Đóng menu" : "Mở menu"} aria-expanded={mobileOpen}>{mobileOpen ? "×" : "☰"}</button>
      <Link href="/" className="min-w-0 shrink-0 text-lg font-bold text-slate-950 sm:text-xl" aria-label={storeName}>{storeName}</Link>
      <nav className="hidden flex-1 items-center gap-5 pl-4 text-sm font-semibold text-slate-700 md:flex" aria-label="Điều hướng chính">{navigation.map(([label, href]) => <Link key={href} href={href} className="transition hover:text-teal-800">{label}</Link>)}</nav>
      <form action="/search" className="hidden min-w-0 flex-1 items-center gap-2 sm:flex sm:max-w-sm" role="search"><label className="sr-only" htmlFor="site-search">Tìm kiếm sản phẩm</label><input id="site-search" name="q" value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-600/20" placeholder="Tìm sản phẩm..." /><button type="submit" className="inline-flex size-11 items-center justify-center rounded-md bg-slate-950 text-lg text-white hover:bg-teal-800" aria-label="Tìm kiếm" title="Tìm kiếm">⌕</button></form>
      <Link href="/wishlist" className="hidden size-11 items-center justify-center rounded-md border border-slate-300 text-lg text-slate-900 hover:border-teal-700 sm:inline-flex" aria-label="Danh sách yêu thích" title="Danh sách yêu thích">♡</Link>
      {user ? <div className="relative hidden sm:block"><button type="button" onClick={() => void toggleNotifications()} className="relative inline-flex size-11 items-center justify-center rounded-md border border-slate-300 text-lg text-slate-900 hover:border-teal-700" aria-label={`Thông báo, ${unreadCount} chưa đọc`} title="Thông báo" aria-expanded={notificationOpen} aria-haspopup="menu">🔔{unreadCount > 0 ? <span className="absolute -right-2 -top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}</button>{notificationOpen ? <div className="absolute right-0 mt-2 w-80 rounded-md border border-slate-200 bg-white p-3 shadow-lg" role="menu"><div className="flex items-center justify-between gap-3"><p className="font-bold text-slate-950">Thông báo</p><Link href="/account/notifications" className="text-xs font-semibold text-teal-800" role="menuitem">Xem tất cả</Link></div>{notificationLoading ? <p className="py-5 text-sm text-slate-600">Đang tải thông báo...</p> : notifications.length === 0 ? <p className="py-5 text-sm text-slate-600">Chưa có thông báo mới.</p> : <div className="mt-2 divide-y divide-slate-100">{notifications.map((item) => <Link key={item.id} href={item.action_url || "/account/notifications"} className={`block py-3 text-sm hover:bg-slate-50 ${item.read_at ? "opacity-70" : ""}`} role="menuitem"><p className="font-semibold text-slate-950">{item.title}</p><p className="mt-1 line-clamp-2 text-slate-600">{item.message}</p></Link>)}</div>}</div> : null}</div> : null}
      <Link href="/cart" className="relative inline-flex size-11 items-center justify-center rounded-md border border-slate-300 text-lg text-slate-900 hover:border-teal-700" aria-label={`Giỏ hàng, ${totalQuantity} sản phẩm`} title="Giỏ hàng">🛒{totalQuantity > 0 ? <span className="absolute -right-2 -top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-teal-700 px-1 text-[11px] font-bold text-white">{totalQuantity > 99 ? "99+" : totalQuantity}</span> : null}</Link>
      {user ? <div className="relative hidden sm:block"><button type="button" onClick={() => setAccountOpen((open) => !open)} className="inline-flex min-h-11 max-w-40 items-center gap-2 rounded-md bg-slate-100 px-3 text-sm font-semibold text-slate-900 hover:bg-slate-200" aria-expanded={accountOpen} aria-haspopup="menu"><HeaderAvatar user={user} /><span className="max-w-24 truncate">{user.name}</span><span aria-hidden="true">⌄</span></button>{accountOpen ? <div className="absolute right-0 mt-2 w-52 rounded-md border border-slate-200 bg-white p-2 shadow-lg" role="menu"><Link href="/account/profile" className="block rounded px-3 py-2 text-sm hover:bg-slate-100" role="menuitem">Tài khoản</Link><Link href="/account/security" className="block rounded px-3 py-2 text-sm hover:bg-slate-100" role="menuitem">Bảo mật</Link><Link href="/account/orders" className="block rounded px-3 py-2 text-sm hover:bg-slate-100" role="menuitem">Đơn hàng</Link><Link href="/account/addresses" className="block rounded px-3 py-2 text-sm hover:bg-slate-100" role="menuitem">Địa chỉ</Link>{staffRoles.includes(user.role) ? <Link href="/admin" className="block rounded px-3 py-2 text-sm hover:bg-slate-100" role="menuitem">Quản trị</Link> : null}<button type="button" onClick={() => void logout()} className="mt-1 w-full rounded border-t border-slate-200 px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50" role="menuitem">Đăng xuất</button></div> : null}</div> : <Link href="/login" className="hidden min-h-11 items-center rounded-md bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-teal-800 sm:inline-flex">Đăng nhập</Link>}
    </div>
    <div className="border-t border-slate-100 px-4 py-2 sm:hidden"><form action="/search" className="mx-auto flex max-w-7xl items-center gap-2" role="search"><label className="sr-only" htmlFor="mobile-search">Tìm kiếm sản phẩm</label><input id="mobile-search" name="q" value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm" placeholder="Tìm sản phẩm..." /><button type="submit" className="size-10 rounded-md bg-slate-950 text-lg text-white" aria-label="Tìm kiếm">⌕</button></form></div>
    {mobileOpen ? <nav className="border-t border-slate-200 bg-white px-4 py-3 md:hidden" aria-label="Điều hướng di động"><div className="mx-auto grid max-w-7xl gap-1">{navigation.map(([label, href]) => <Link key={href} href={href} className="rounded-md px-3 py-3 font-semibold hover:bg-slate-100">{label}</Link>)}<Link href="/wishlist" className="rounded-md px-3 py-3 font-semibold hover:bg-slate-100">Danh sách yêu thích</Link>{user ? <><Link href="/account/profile" className="rounded-md px-3 py-3 font-semibold hover:bg-slate-100">Tài khoản của tôi</Link><Link href="/account/orders" className="rounded-md px-3 py-3 font-semibold hover:bg-slate-100">Đơn hàng</Link>{staffRoles.includes(user.role) ? <Link href="/admin" className="rounded-md px-3 py-3 font-semibold hover:bg-slate-100">Quản trị</Link> : null}<button type="button" onClick={() => void logout()} className="rounded-md px-3 py-3 text-left font-semibold text-red-700 hover:bg-red-50">Đăng xuất</button></> : <Link href="/login" className="rounded-md bg-slate-950 px-3 py-3 text-center font-semibold text-white">Đăng nhập</Link>}</div></nav> : null}
  </header>;
}

function HeaderAvatar({ user }: { user: User }) {
  return user.avatar_url ? <img src={user.avatar_url} alt="" className="size-7 rounded-full object-cover" /> : <span className="inline-flex size-7 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-900" aria-hidden="true">{user.name.split(" ").filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase()}</span>;
}
