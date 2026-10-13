import Link from "next/link";

const links = [["/categories", "Danh mục"], ["/brands", "Thương hiệu"], ["/products", "Sản phẩm"]];

export default function ShopLayout({ children }) {
  return <div className="shop-shell min-h-screen">
    <div className="bg-[#142f2c] px-4 py-2 text-center text-[11px] font-medium tracking-wide text-white/80">Thiết bị hữu ích, lựa chọn có gu <span className="mx-2 text-[#b8e0c7]">✳</span> Khám phá bộ sưu tập CT_24F</div>
    <header className="sticky top-0 z-30 border-b border-[#e8ede9] bg-[#fbfcfa]/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <Link className="flex items-center gap-3" href="/"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#142f2c] font-serif text-xl italic text-[#cde8d4]">C</span><span className="leading-tight"><span className="block text-sm font-bold tracking-[.13em] text-[#142f2c]">CT_24F</span><span className="block text-[10px] tracking-[.15em] text-slate-500">TECH, THOUGHTFULLY</span></span></Link>
        <div className="hidden items-center gap-8 md:flex">{links.map(([href, label]) => <Link className="text-sm font-medium text-slate-600 transition hover:text-[#37665b]" href={href} key={href}>{label}</Link>)}</div>
        <div className="flex items-center gap-2"><Link aria-label="Đi tới sản phẩm" className="grid h-10 w-10 place-items-center rounded-full border border-[#e4eae5] text-[#244941] transition hover:bg-[#edf3ee]" href="/products">⌕</Link><Link className="rounded-full bg-[#142f2c] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#28564d]" href="/admin">Quản trị <span aria-hidden="true">↗</span></Link></div>
      </nav>
      <div className="flex justify-center gap-6 border-t border-[#eef1ee] px-4 py-2 md:hidden">{links.map(([href, label]) => <Link className="text-xs font-medium text-slate-600" href={href} key={href}>{label}</Link>)}</div>
    </header>
    <main className="mx-auto max-w-7xl px-5 py-8 sm:py-10 lg:px-8">{children}</main>
    <footer className="border-t border-[#e8ede9] bg-white"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-7 text-xs text-slate-500 sm:flex-row sm:items-center lg:px-8"><span className="font-semibold tracking-[.12em] text-[#244941]">CT_24F · TECH, THOUGHTFULLY</span><span>Đồ án học phần · Giao diện mua sắm công nghệ</span></div></footer>
  </div>;
}
