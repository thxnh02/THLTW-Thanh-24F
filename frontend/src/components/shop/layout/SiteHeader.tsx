"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Bell,
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useStoreSettings } from "@/context/StoreSettingsContext";
import { accountService } from "@/services/accountService";
import type { CustomerNotification, User as UserType } from "@/types/api";

const staffRoles = ["admin", "manager", "staff"];
const navigation = [
  ["Sản phẩm", "/products"],
  ["Bài viết", "/posts"],
  ["Liên hệ", "/contact"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { totalQuantity } = useCart();
  const { store_name: storeName } = useStoreSettings();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);

  useEffect(() => {
    if (!user) return;

    accountService.getNotifications("per_page=1")
      .then(({ meta }) => setUnreadCount(Number(meta.unread_count ?? 0)))
      .catch(() => undefined);
  }, [user]);

  async function toggleNotifications() {
    const nextOpen = !notificationOpen;
    setNotificationOpen(nextOpen);

    if (!nextOpen || notifications.length > 0) return;

    setNotificationLoading(true);
    try {
      setNotifications((await accountService.getNotifications("per_page=4")).data);
    } catch {
      setNotifications([]);
    } finally {
      setNotificationLoading(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="bg-slate-950 text-xs text-slate-200">
        <div className="page-shell flex min-h-9 items-center justify-between gap-4 py-2">
          <p className="truncate">
            <span className="font-bold text-teal-300">{storeName}</span>
            <span className="mx-2 text-slate-500">|</span>
            Thiết bị công nghệ cho nhịp sống hiện đại
          </p>
          <Link href="/posts" className="hidden shrink-0 font-semibold text-white hover:text-teal-300 sm:block">
            Góc công nghệ
          </Link>
        </div>
      </div>

      <div className="page-shell flex min-h-[72px] items-center gap-3 lg:gap-6">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-slate-800 hover:border-teal-600 hover:text-teal-700 md:hidden"
            aria-label="Mở menu"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <SheetContent side="left" className="p-0">
            <SheetHeader className="border-b border-[var(--border)] px-5 py-5">
              <SheetTitle>{storeName}</SheetTitle>
            </SheetHeader>
            <nav className="grid gap-1 px-3 py-4" aria-label="Điều hướng di động">
              {navigation.map(([label, href]) => (
                <SheetClose asChild key={href}>
                  <Link href={href} className="rounded-lg px-3 py-3 font-semibold text-slate-800 hover:bg-teal-50 hover:text-teal-800">
                    {label}
                  </Link>
                </SheetClose>
              ))}
              <SheetClose asChild>
                <Link href="/wishlist" className="rounded-lg px-3 py-3 font-semibold text-slate-800 hover:bg-teal-50 hover:text-teal-800">
                  Danh sách yêu thích
                </Link>
              </SheetClose>
              {user ? (
                <>
                  <SheetClose asChild>
                    <Link href="/account/profile" className="rounded-lg px-3 py-3 font-semibold text-slate-800 hover:bg-teal-50 hover:text-teal-800">
                      Tài khoản của tôi
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/account/orders" className="rounded-lg px-3 py-3 font-semibold text-slate-800 hover:bg-teal-50 hover:text-teal-800">
                      Đơn hàng
                    </Link>
                  </SheetClose>
                  {staffRoles.includes(user.role) ? (
                    <SheetClose asChild>
                      <Link href="/admin" className="rounded-lg px-3 py-3 font-semibold text-slate-800 hover:bg-teal-50 hover:text-teal-800">
                        Quản trị
                      </Link>
                    </SheetClose>
                  ) : null}
                  <button type="button" onClick={() => void logout()} className="rounded-lg px-3 py-3 text-left font-semibold text-red-700 hover:bg-red-50">
                    Đăng xuất
                  </button>
                </>
              ) : (
                <SheetClose asChild>
                  <Link href="/login" className="mt-2 rounded-lg bg-slate-950 px-3 py-3 text-center font-semibold text-white hover:bg-teal-700">
                    Đăng nhập
                  </Link>
                </SheetClose>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="group flex min-w-0 shrink-0 items-center gap-2.5" aria-label={storeName}>
          <span className="grid size-9 place-items-center rounded-lg bg-teal-600 text-sm font-black text-white shadow-sm shadow-teal-600/20 transition group-hover:bg-slate-950">N</span>
          <span className="max-w-36 truncate text-lg font-black tracking-normal text-slate-950 sm:max-w-none sm:text-xl">{storeName}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Điều hướng chính">
          {navigation.map(([label, href]) => (
            <Link key={href} href={href} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${pathname.startsWith(href) ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>
              {label}
            </Link>
          ))}
        </nav>

        <form action="/search" className="ml-auto hidden min-w-0 flex-1 items-center lg:flex lg:max-w-md" role="search">
          <label className="sr-only" htmlFor="site-search">Tìm kiếm sản phẩm</label>
          <input id="site-search" name="q" value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 min-w-0 flex-1 rounded-l-lg border border-r-0 border-[var(--border)] bg-slate-50 px-3.5 text-sm outline-none transition focus:border-teal-600 focus:bg-white" placeholder="Tìm điện thoại, laptop..." />
          <button type="submit" className="inline-flex size-10 items-center justify-center rounded-r-lg bg-slate-950 text-white transition hover:bg-teal-700" aria-label="Tìm kiếm" title="Tìm kiếm">
            <Search size={18} aria-hidden="true" />
          </button>
        </form>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <HeaderIcon href="/wishlist" label="Danh sách yêu thích" className="hidden sm:inline-flex"><Heart size={18} aria-hidden="true" /></HeaderIcon>
          {user ? (
            <div className="relative hidden sm:block">
              <button type="button" onClick={() => void toggleNotifications()} className="relative inline-flex size-10 items-center justify-center rounded-lg border border-[var(--border)] text-slate-700 transition hover:border-teal-600 hover:text-teal-700" aria-label={`Thông báo, ${unreadCount} chưa đọc`} title="Thông báo" aria-expanded={notificationOpen}>
                <Bell size={18} aria-hidden="true" />
                <CountBubble count={unreadCount} color="bg-red-600" />
              </button>
              <AnimatePresence>{notificationOpen ? <NotificationMenu loading={notificationLoading} notifications={notifications} /> : null}</AnimatePresence>
            </div>
          ) : null}
          <Link href="/cart" className="relative inline-flex size-10 items-center justify-center rounded-lg border border-[var(--border)] text-slate-700 transition hover:border-teal-600 hover:text-teal-700" aria-label={`Giỏ hàng, ${totalQuantity} sản phẩm`} title="Giỏ hàng">
            <ShoppingCart size={18} aria-hidden="true" />
            <CountBubble count={totalQuantity} color="bg-teal-600" />
          </Link>
          {user ? (
            <div className="relative hidden sm:block">
              <button type="button" onClick={() => setAccountOpen((open) => !open)} className="inline-flex min-h-10 max-w-48 items-center gap-2 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-900 transition hover:bg-teal-50" aria-expanded={accountOpen}>
                <HeaderAvatar user={user} />
                <span className="max-w-28 truncate">{user.name}</span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>
              <AnimatePresence>{accountOpen ? <AccountMenu user={user} logout={logout} /> : null}</AnimatePresence>
            </div>
          ) : (
            <Link href="/login" className="hidden min-h-10 items-center rounded-lg bg-slate-950 px-3.5 text-sm font-semibold text-white transition hover:bg-teal-700 sm:inline-flex"><User size={16} className="mr-2" aria-hidden="true" />Đăng nhập</Link>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 py-2.5 lg:hidden">
        <form action="/search" className="page-shell flex items-center px-0" role="search">
          <label className="sr-only" htmlFor="mobile-search">Tìm kiếm sản phẩm</label>
          <input id="mobile-search" name="q" value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 min-w-0 flex-1 rounded-l-lg border border-r-0 border-[var(--border)] bg-slate-50 px-3 text-sm" placeholder="Tìm sản phẩm..." />
          <button type="submit" className="size-10 rounded-r-lg bg-slate-950 text-white" aria-label="Tìm kiếm"><Search size={17} className="mx-auto" aria-hidden="true" /></button>
        </form>
      </div>
    </header>
  );
}

function HeaderIcon({ href, label, className, children }: { href: string; label: string; className?: string; children: React.ReactNode }) {
  return <Link href={href} className={`size-10 items-center justify-center rounded-lg border border-[var(--border)] text-slate-700 transition hover:border-teal-600 hover:text-teal-700 ${className ?? "inline-flex"}`} aria-label={label} title={label}>{children}</Link>;
}

function CountBubble({ count, color }: { count: number; color: string }) {
  if (count < 1) return null;
  return <span className={`absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${color}`}>{count > 99 ? "99+" : count}</span>;
}

function NotificationMenu({ loading, notifications }: { loading: boolean; notifications: CustomerNotification[] }) {
  const reducedMotion = useReducedMotion();
  return <motion.div initial={reducedMotion ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -6 }} transition={{ duration: 0.16 }} className="absolute right-0 mt-2 w-80 rounded-lg border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-popover)]" role="menu"><div className="flex items-center justify-between gap-3"><p className="font-bold text-slate-950">Thông báo</p><Link href="/account/notifications" className="text-xs font-semibold text-teal-800" role="menuitem">Xem tất cả</Link></div>{loading ? <p className="py-5 text-sm text-slate-600">Đang tải thông báo...</p> : notifications.length === 0 ? <p className="py-5 text-sm text-slate-600">Chưa có thông báo mới.</p> : <div className="mt-2 divide-y divide-slate-100">{notifications.map((item) => <Link key={item.id} href={item.action_url || "/account/notifications"} className={`block py-3 text-sm hover:bg-slate-50 ${item.read_at ? "opacity-70" : ""}`} role="menuitem"><p className="font-semibold text-slate-950">{item.title}</p><p className="mt-1 line-clamp-2 text-slate-600">{item.message}</p></Link>)}</div>}</motion.div>;
}

function AccountMenu({ user, logout }: { user: UserType; logout: () => Promise<void> }) {
  const reducedMotion = useReducedMotion();
  return <motion.div initial={reducedMotion ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -6 }} transition={{ duration: 0.16 }} className="absolute right-0 mt-2 w-56 rounded-lg border border-[var(--border)] bg-white p-2 shadow-[var(--shadow-popover)]" role="menu"><Link href="/account/profile" className="block rounded-md px-3 py-2.5 text-sm hover:bg-slate-50" role="menuitem">Tài khoản</Link><Link href="/account/security" className="block rounded-md px-3 py-2.5 text-sm hover:bg-slate-50" role="menuitem">Bảo mật</Link><Link href="/account/orders" className="block rounded-md px-3 py-2.5 text-sm hover:bg-slate-50" role="menuitem">Đơn hàng</Link><Link href="/account/addresses" className="block rounded-md px-3 py-2.5 text-sm hover:bg-slate-50" role="menuitem">Địa chỉ</Link>{staffRoles.includes(user.role) ? <Link href="/admin" className="block rounded-md px-3 py-2.5 text-sm hover:bg-slate-50" role="menuitem">Quản trị</Link> : null}<button type="button" onClick={() => void logout()} className="mt-1 flex w-full items-center gap-2 rounded-md border-t border-slate-200 px-3 py-2.5 text-left text-sm font-semibold text-red-700 hover:bg-red-50" role="menuitem"><LogOut size={16} aria-hidden="true" />Đăng xuất</button></motion.div>;
}

function HeaderAvatar({ user }: { user: UserType }) {
  return user.avatar_url ? <Image src={user.avatar_url} alt="" width={28} height={28} unoptimized className="size-7 rounded-full object-cover" /> : <span className="inline-flex size-7 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-900" aria-hidden="true">{user.name.split(" ").filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase()}</span>;
}
