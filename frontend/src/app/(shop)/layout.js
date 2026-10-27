import Link from "next/link";
import ShopHeader from "@/components/shop/ShopHeader";

export default function ShopLayout({ children }) {
  return <div className="shop-shell min-h-screen">
    <ShopHeader />
    <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
    <footer className="border-t border-[#e8ede9] bg-white"><div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-3 px-4 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-6 lg:px-8"><span className="font-semibold tracking-[.12em] text-[#244941]">CT_24F · CÔNG NGHỆ ĐƯỢC CHỌN LỌC</span><span>Cửa hàng công nghệ · Thiết bị và phụ kiện · <Link className="font-semibold text-[#37665b] hover:underline" href="/posts">Bài viết</Link> · <Link className="text-slate-400 hover:text-[#37665b]" href="/admin">Quản trị</Link></span></div></footer>
  </div>;
}
