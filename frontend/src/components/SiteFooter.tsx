"use client";

import Link from "next/link";

import { useStoreSettings } from "@/contexts/StoreSettingsContext";

export function SiteFooter() {
  const settings = useStoreSettings();
  const name = settings.store_name || "Công Nghệ Việt";

  return <footer className="mt-16 border-t border-slate-200 bg-slate-950 text-slate-300"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4"><div className="sm:col-span-2"><p className="text-xl font-bold text-white">{name}</p><p className="mt-3 max-w-md text-sm leading-6">Sản phẩm công nghệ chính hãng, thông tin rõ ràng và hỗ trợ tận tâm.</p></div><div><p className="font-semibold text-white">Hỗ trợ</p><div className="mt-3 grid gap-2 text-sm"><Link href="/products" className="hover:text-white">Sản phẩm</Link><Link href="/posts" className="hover:text-white">Bài viết</Link><Link href="/contact" className="hover:text-white">Liên hệ</Link></div></div><div><p className="font-semibold text-white">Liên hệ</p><div className="mt-3 grid gap-2 text-sm">{settings.phone ? <a href={`tel:${settings.phone}`} className="hover:text-white">{settings.phone}</a> : null}{settings.email ? <a href={`mailto:${settings.email}`} className="break-all hover:text-white">{settings.email}</a> : null}{settings.address ? <span>{settings.address}</span> : null}</div></div></div><div className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-400">© {new Date().getFullYear()} {name}</div></footer>;
}
