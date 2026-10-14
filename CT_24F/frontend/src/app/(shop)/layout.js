import Link from "next/link";
import { ArrowUpRight, Search, Sparkles } from "lucide-react";

const links = [["/categories", "Categories"], ["/brands", "Brands"], ["/products", "Products"]];

export default function ShopLayout({ children }) {
  return <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
    <div className="bg-[#101a2b] px-4 py-2 text-center text-[10px] font-medium tracking-[.08em] text-slate-200 sm:text-xs"><span className="mr-2 inline-flex align-middle text-indigo-300"><Sparkles aria-hidden="true" size={13} /></span>Useful technology, thoughtfully selected · CT_24F</div>
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <nav aria-label="Store navigation" className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link aria-label="CT_24F storefront home" className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" href="/">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#101a2b] font-serif text-xl italic text-indigo-200">C</span>
          <span className="leading-tight"><span className="block text-sm font-bold tracking-[.12em] text-slate-950">CT_24F</span><span className="hidden text-[9px] font-medium tracking-[.14em] text-slate-500 sm:block">TECH, THOUGHTFULLY</span></span>
        </Link>
        <div className="hidden items-center gap-7 md:flex">{links.map(([href, label]) => <Link className="rounded-md px-2 py-2 text-sm font-medium text-slate-600 transition hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href={href} key={href}>{label}</Link>)}</div>
        <div className="flex shrink-0 items-center gap-2"><Link aria-label="Browse products" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href="/products"><Search aria-hidden="true" size={18} /></Link><Link className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#101a2b] px-3 text-xs font-semibold text-white transition hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-4 sm:text-sm" href="/admin"><span>Admin</span><ArrowUpRight aria-hidden="true" size={14} /></Link></div>
      </nav>
      <nav aria-label="Browse catalog" className="flex justify-center gap-2 border-t border-slate-100 px-3 py-2 md:hidden">{links.map(([href, label]) => <Link className="min-h-10 rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1" href={href} key={href}>{label}</Link>)}</nav>
    </header>
    <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">{children}</main>
    <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-6 lg:px-8"><span className="font-semibold tracking-[.12em] text-slate-800">CT_24F · TECH, THOUGHTFULLY</span><span>Course project · Technology catalog storefront</span></div></footer>
  </div>;
}
