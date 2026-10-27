"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
import GlobalProductSearch from "@/components/shop/GlobalProductSearch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const links = [["/", "Trang chủ"], ["/products", "Sản phẩm"], ["/categories", "Danh mục"], ["/brands", "Thương hiệu"], ["/posts", "Bài viết"]];

function ShopHeaderContent() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelPath, setPanelPath] = useState(pathname);
  const searchVisible = searchOpen && panelPath === pathname;
  const menuVisible = menuOpen && panelPath === pathname;

  const closePanels = () => { setSearchOpen(false); setMenuOpen(false); };
  const navLinks = (className = "") => links.map(([href, label]) => <Link aria-current={pathname === href ? "page" : undefined} className={className} href={href} key={href} onClick={closePanels}>{label}</Link>);

  return <header className="shop-header relative z-40 border-b border-[#e5ebe6] bg-[#fbfcfa]/95 backdrop-blur">
    <nav aria-label="Điều hướng cửa hàng" className="relative mx-auto flex h-16 max-w-[1280px] items-center gap-2 px-3 sm:px-5 lg:px-8">
      <Link aria-label="CT_24F — Trang chủ" className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#37665b]" href="/" onClick={closePanels}>
        <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-[#142f2c] font-serif text-lg italic text-[#cde8d4]">C</span>
        <span className="leading-tight"><span className="block text-[13px] font-bold tracking-[.12em] text-[#142f2c]">CT_24F</span><span className="hidden text-[9px] tracking-[.1em] text-slate-500 sm:block">CÔNG NGHỆ ĐƯỢC CHỌN LỌC</span></span>
      </Link>

      <div className="ml-auto hidden items-center gap-3 md:flex lg:gap-5">{navLinks("min-h-11 inline-flex items-center whitespace-nowrap text-[12px] font-medium text-slate-600 transition hover:text-[#193f36] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-[#37665b] lg:text-[13px]")}</div>

      <button aria-controls="shop-search-panel" aria-expanded={searchVisible} aria-label={searchVisible ? "Đóng tìm kiếm" : "Mở tìm kiếm sản phẩm"} className="ml-auto grid size-10 shrink-0 place-items-center rounded-full text-[#193f36] transition hover:bg-[#eaf1eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#37665b] md:ml-2" onPointerDown={(event) => event.stopPropagation()} onClick={() => { setMenuOpen(false); setPanelPath(pathname); setSearchOpen(!searchVisible); }} type="button">
        {searchVisible ? <X aria-hidden="true" size={19} /> : <Search aria-hidden="true" size={19} />}
      </button>

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
      </SheetContent>
    </Sheet>
  </header>;
}

export default function ShopHeader() {
  const pathname = usePathname();
  return <ShopHeaderContent key={pathname} />;
}
