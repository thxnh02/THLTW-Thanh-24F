"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogIn, LogOut, Menu, Search, UserRound, X } from "lucide-react";
import GlobalProductSearch from "@/components/shop/GlobalProductSearch";
import CustomerAvatar from "@/components/shop/CustomerAvatar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

const links = [["/", "Trang chủ"], ["/products", "Sản phẩm"], ["/categories", "Danh mục"], ["/brands", "Thương hiệu"], ["/posts", "Bài viết"]];

function ShopHeaderContent() {
  const pathname = usePathname();
  const { user, loading: authLoading, logout } = useCustomerAuth();
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
  const navLinks = (className = "") => links.map(([href, label]) => <Link aria-current={pathname === href ? "page" : undefined} className={className} href={href} key={href} onClick={closePanels}>{label}</Link>);

  return <header className="shop-header relative z-40 border-b border-[#e5ebe6] bg-[#fbfcfa]/95 backdrop-blur">
    <nav aria-label="Điều hướng cửa hàng" className="relative mx-auto flex h-16 max-w-[1280px] items-center gap-2 px-3 sm:px-5 lg:px-8">
      <Link aria-label="CT_24F — Trang chủ" className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#37665b]" href="/" onClick={closePanels}>
        <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-[#142f2c] font-serif text-lg italic text-[#cde8d4]">C</span>
        <span className="leading-tight"><span className="block text-[13px] font-bold tracking-[.12em] text-[#142f2c]">CT_24F</span><span className="hidden text-[9px] tracking-[.1em] text-slate-500 sm:block">CÔNG NGHỆ ĐƯỢC CHỌN LỌC</span></span>
      </Link>

      <div className="ml-auto hidden items-center gap-3 md:flex lg:gap-5">{navLinks("min-h-11 inline-flex items-center whitespace-nowrap text-[12px] font-medium text-slate-600 transition hover:text-[#193f36] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-[#37665b] lg:text-[13px]")}</div>

      {authLoading ? <span aria-label="Đang tải tài khoản" className="grid size-10 shrink-0 place-items-center text-[#587168]" role="status">…</span> : user ? <>
        <Link aria-label="Tài khoản" className="md:hidden" href="/account" onClick={closePanels}><CustomerAvatar size="size-9" user={user} /></Link>
        <details className="group relative hidden md:block"><summary className="flex min-h-11 max-w-40 cursor-pointer list-none items-center gap-2 rounded-full px-2 text-sm font-medium text-[#29483f] hover:bg-[#eaf1eb] focus-visible:outline-2 focus-visible:outline-[#37665b] [&::-webkit-details-marker]:hidden"><CustomerAvatar size="size-8" user={user} /><span className="truncate">{user.name.split(" ")[0]}</span></summary><div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-[#dce7de] bg-white p-1.5 shadow-lg"><Link className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-[#29483f] hover:bg-[#eff5ef]" href="/account"><UserRound className="size-4" />Hồ sơ</Link><Link className="flex min-h-10 items-center rounded-lg px-3 text-sm text-[#29483f] hover:bg-[#eff5ef]" href="/account/addresses">Địa chỉ</Link><Link className="flex min-h-10 items-center rounded-lg px-3 text-sm text-[#29483f] hover:bg-[#eff5ef]" href="/account/security">Bảo mật</Link><button className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-rose-700 hover:bg-rose-50" onClick={signOut} type="button"><LogOut className="size-4" />Đăng xuất</button></div></details>
      </> : <><Link aria-label="Đăng nhập" className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-2 text-sm font-medium text-[#29483f] hover:bg-[#eaf1eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#37665b]" href="/login" onClick={closePanels}><LogIn aria-hidden="true" className="size-5 shrink-0" /><span className="hidden sm:inline">Đăng nhập</span></Link><Link className="hidden min-h-10 items-center rounded-full px-3 text-xs font-semibold text-[#37665b] hover:bg-[#eaf1eb] lg:inline-flex" href="/register">Đăng ký</Link></>}

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
          </> : <div className="flex flex-col gap-1"><Link className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[#29483f] hover:bg-[#eaf1eb]" href="/login" onClick={closePanels}><LogIn aria-hidden="true" className="size-4" />Đăng nhập</Link><Link className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-[#37665b] hover:bg-[#eaf1eb]" href="/register" onClick={closePanels}>Tạo tài khoản</Link></div>}
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
