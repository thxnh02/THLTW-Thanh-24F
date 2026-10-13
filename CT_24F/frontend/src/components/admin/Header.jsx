import Link from "next/link";

export default function Header() {
  return <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#e7ece8] bg-white/90 px-5 py-4 backdrop-blur sm:px-8"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#789087]">Workspace</p><p className="mt-1 text-sm font-semibold text-[#19352f]">Quản trị cửa hàng</p></div><Link className="rounded-full border border-[#e0e8e2] px-4 py-2 text-xs font-semibold text-[#37665b] transition hover:bg-[#f0f5f1]" href="/">← Về cửa hàng</Link></header>;
}
