"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, LogIn, LogOut, Menu, Search, ShoppingCart, UserRound, X } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import GlobalProductSearch from "@/components/shop/GlobalProductSearch";
import CustomerAvatar from "@/components/shop/CustomerAvatar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useCart } from "@/contexts/CartContext";
import commerceServices from "@/services/commerceServices";
import axiosClient from "@/lib/axiosClient";
import { useShopSettings } from "@/contexts/ShopSettingsContext";

const links = [["/", "Trang chủ"], ["/products", "Sản phẩm"], ["/categories", "Danh mục"], ["/brands", "Thương hiệu"], ["/posts", "Bài viết"], ["/contact", "Liên hệ"]];

function ShopHeaderContent() {
  const pathname = usePathname();
  const settings = useShopSettings();
  const { user, loading: authLoading, logout } = useCustomerAuth();
  const { count } = useCart();
  const [unread, setUnread] = useState(0);
  const [extraLinks, setExtraLinks] = useState([]);
  useEffect(() => {
    let active = true;
    axiosClient.get('/site-content/menu').then(({ data }) => { if (active) setExtraLinks(data.data ?? []); }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = () => commerceServices.notifications(1).then(({ data }) => { if (active) setUnread(data.data?.unread_count ?? 0); }).catch(() => {});
    load();
    const timer = setInterval(load, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [user?.id, pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelPath, setPanelPath] = useState(pathname);
  const [logoutError, setLogoutError] = useState("");
  const searchVisible = searchOpen && panelPath === pathname;
  const menuVisible = menuOpen && panelPath === pathname;

  const closePanels = () => { setSearchOpen(false); setMenuOpen(false); };
  const signOut = async () => {
    setLogoutError("");
    try { await logout(); } catch { setLogoutError("Không thể đăng xuất lúc này. Vui lòng thử lại."); }
  };
  const navLinks = (className = "") => [...links, ...extraLinks.filter((item) => item.href).map((item) => [item.href, item.title])].map(([href, label], index) => <Link aria-current={pathname === href ? "page" : undefined} className={className} href={href} key={`${href}:${index}`} onClick={closePanels}>{label}</Link>);
  const loginHref = pathname === "/login" || pathname === "/register" ? "/login" : `/login?returnTo=${encodeURIComponent(pathname)}`;

  return <header className="shop-header relative z-40 border-b border-[#e5ebe6] bg-[#fbfcfa]/95 backdrop-blur">
    <nav aria-label="Điều hướng cửa hàng" className="relative mx-auto flex h-16 max-w-[1280px] items-center gap-2 px-3 sm:px-5 lg:px-8">
      <Link aria-label={`${settings.shop_name} — Trang chủ`} className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#37665b]" href="/" onClick={closePanels}>
        {settings.logo_url ? <Image unoptimized width={36} height={36} aria-hidden="true" className="size-9 rounded-xl object-contain" src={settings.logo_url} alt="" /> : <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-[#142f2c] font-serif text-lg italic text-[#cde8d4]">C</span>}
        <span className="leading-tight"><span className="block text-[13px] font-bold tracking-[.12em] text-[#142f2c]">{settings.shop_name}</span><span className="hidden text-[9px] tracking-[.1em] text-slate-500 sm:block">CÔNG NGHỆ ĐƯỢC CHỌN LỌC</span></span>
      </Link>

      <div className="ml-auto hidden items-center gap-3 md:flex lg:gap-5">{navLinks("min-h-11 inline-flex items-center whitespace-nowrap text-[12px] font-medium text-slate-600 transition hover:text-[#193f36] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-[#37665b] lg:text-[13px]")}</div>

      {authLoading ? <span aria-label="Đang tải tài khoản" className="grid size-10 shrink-0 place-items-center text-[#587168]" role="status">…</span> : user ? <>
        <Link aria-label="Tài khoản" className="md:hidden" href="/account" onClick={closePanels}><CustomerAvatar size="size-9" user={user} /></Link>
        <DropdownMenu.Root><DropdownMenu.Trigger className="hidden min-h-11 max-w-40 items-center gap-2 rounded-full px-2 text-sm font-medium text-[#29483f] hover:bg-[#eaf1eb] focus-visible:outline-2 focus-visible:outline-[#37665b] md:flex" type="button"><CustomerAvatar size="size-8" user={user} /><span className="truncate">{user.name.split(" ")[0]}</span></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" className="z-50 mt-2 w-48 rounded-xl border border-[#dce7de] bg-white p-1.5 shadow-lg"><DropdownMenu.Item asChild><Link className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-[#29483f] outline-none focus:bg-[#eff5ef]" href="/account"><UserRound className="size-4" />Hồ sơ</Link></DropdownMenu.Item><DropdownMenu.Item asChild><Link className="flex min-h-10 items-center rounded-lg px-3 text-sm text-[#29483f] outline-none focus:bg-[#eff5ef]" href="/account/addresses">Địa chỉ</Link></DropdownMenu.Item><DropdownMenu.Item asChild><Link className="flex min-h-10 items-center rounded-lg px-3 text-sm text-[#29483f] outline-none focus:bg-[#eff5ef]" href="/account/security">Bảo mật</Link></DropdownMenu.Item><DropdownMenu.Item asChild><button className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-rose-700 outline-none focus:bg-rose-50" onClick={signOut} type="button"><LogOut className="size-4" />Đăng xuất</button></DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
      </> : <><Link aria-label="Đăng nhập" className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-2 text-sm font-medium text-[#29483f] hover:bg-[#eaf1eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#37665b]" href={loginHref} onClick={closePanels}><LogIn aria-hidden="true" className="size-5 shrink-0" /><span className="hidden sm:inline">Đăng nhập</span></Link><Link className="hidden min-h-10 items-center rounded-full px-3 text-xs font-semibold text-[#37665b] hover:bg-[#eaf1eb] lg:inline-flex" href="/register">Đăng ký</Link></>}

      <Link aria-label={`Giỏ hàng, ${count} sản phẩm`} className="relative grid size-10 shrink-0 place-items-center rounded-full text-[#193f36] hover:bg-[#eaf1eb]" href="/cart"><ShoppingCart aria-hidden="true" size={19} />{count > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">{count > 99 ? '99+' : count}</span>}</Link>
      {user && <Link aria-label={`Thông báo, ${unread} chưa đọc`} className="relative grid size-10 shrink-0 place-items-center rounded-full text-[#193f36] hover:bg-[#eaf1eb]" href="/account/notifications"><Bell aria-hidden="true" size={19} />{unread > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">{unread > 99 ? '99+' : unread}</span>}</Link>}
      <button aria-controls="shop-search-panel" aria-expanded={searchVisible} aria-label={searchVisible ? "Đóng tìm kiếm" : "Mở tìm kiếm sản phẩm"} className="grid size-10 shrink-0 place-items-center rounded-full text-[#193f36] transition hover:bg-[#eaf1eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#37665b] md:ml-1" onPointerDown={(event) => event.stopPropagation()} onClick={() => { setMenuOpen(false); setPanelPath(pathname); setSearchOpen(!searchVisible); }} type="button">
        {searchVisible ? <X aria-hidden="true" size={19} /> : <Search aria-hidden="true" size={19} />}
      </button>
      {logoutError && <span className="absolute right-2 top-[calc(100%+4px)] z-50 rounded-lg border border-rose-100 bg-white px-3 py-2 text-xs text-rose-700 shadow-md" role="alert">{logoutError}</span>}

      <button aria-label={menuVisible ? "Đóng điều hướng" : "Mở điều hướng"} aria-controls="shop-mobile-navigation" aria-expanded={menuVisible} className="grid size-10 shrink-0 place-items-center rounded-full text-[#193f36] transition hover:bg-[#eaf1eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#37665b] md:hidden" onClick={() => { setSearchOpen(false); setPanelPath(pathname); setMenuOpen(!menuVisible); }} type="button"><Menu aria-hidden="true" size={20} /></button>

      {searchVisible && <div className="absolute inset-x-0 top-[calc(100%+1px)] z-50 border-b border-[#e5ebe6] bg-[#fbfcfa] p-3 shadow-lg sm:inset-x-auto sm:right-4 sm:top-[calc(100%+8px)] sm:w-[min(30rem,calc(100vw-2rem))] sm:rounded-2xl sm:border sm:p-4" id="shop-search-panel"><GlobalProductSearch autoFocus onClose={() => setSearchOpen(false)} /></div>}
    </nav>

    <Sheet onOpenChange={setMenuOpen} open={menuVisible}>
      <SheetContent className="w-[min(21rem,88vw)] border-[#d8e2da] bg-[#fbfcfa]" id="shop-mobile-navigation" side="right">
        <SheetHeader className="border-b border-[#e7eee8] pb-4 pr-12">
          <SheetTitle className="text-left text-[#19352f]">Danh mục cửa hàng</SheetTitle>
          <SheetDescription className="text-left">Chọn khu vực bạn muốn khám phá.</SheetDescription>
        </SheetHeader>
        <nav aria-label="Điều hướng di động" className="flex flex-col gap-1 px-4">{navLinks("flex min-h-12 items-center rounded-xl px-3 text-sm font-medium text-[#29483f] hover:bg-[#eaf1eb] focus-visible:outline-2 focus-visible:outline-[#37665b]")}</nav>
        <div className="mt-4 border-t border-[#e7eee8] px-4 pt-4">
          {authLoading ? <p aria-live="polite" className="px-3 py-2 text-sm text-slate-500">Đang tải tài khoản…</p> : user ? <>
            <Link className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[#29483f] hover:bg-[#eaf1eb]" href="/account" onClick={closePanels}><CustomerAvatar size="size-7" user={user} />Tài khoản của {user.name.split(" ")[0]}</Link>
            <Link className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-[#29483f] hover:bg-[#eaf1eb]" href="/account/addresses" onClick={closePanels}>Địa chỉ</Link><Link className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-[#29483f] hover:bg-[#eaf1eb]" href="/account/security" onClick={closePanels}>Bảo mật</Link>
            <button className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-medium text-[#29483f] hover:bg-[#eaf1eb]" onClick={signOut} type="button"><LogOut aria-hidden="true" className="size-4" />Đăng xuất</button>
          </> : <div className="flex flex-col gap-1"><Link className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[#29483f] hover:bg-[#eaf1eb]" href={loginHref} onClick={closePanels}><LogIn aria-hidden="true" className="size-4" />Đăng nhập</Link><Link className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-[#37665b] hover:bg-[#eaf1eb]" href="/register" onClick={closePanels}>Tạo tài khoản</Link></div>}
          {logoutError && <p className="mt-2 text-xs text-rose-700" role="alert">{logoutError}</p>}
        </div>
      </SheetContent>
    </Sheet>
  </header>;
}

export default function ShopHeader() {
  const pathname = usePathname();
  return <ShopHeaderContent key={pathname} />;
}
