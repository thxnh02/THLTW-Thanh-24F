"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useShopSettings } from '@/contexts/ShopSettingsContext';
import axiosClient from '@/lib/axiosClient';

export default function ShopFooter() {
  const settings = useShopSettings();
  const [pages, setPages] = useState([]);
  useEffect(() => {
    let active = true;
    axiosClient.get('/site-content/page').then(({ data }) => { if (active) setPages(data.data ?? []); }).catch(() => {});
    return () => { active = false; };
  }, []);
  return <footer className="border-t border-[#e8ede9] bg-white"><div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-4 px-4 py-7 text-xs text-slate-500 sm:flex-row sm:items-start sm:px-6 lg:px-8"><span className="font-semibold tracking-[.12em] text-[#244941]">{settings.shop_name} · CÔNG NGHỆ ĐƯỢC CHỌN LỌC</span><div className="flex max-w-2xl flex-wrap gap-x-4 gap-y-3">{settings.contact_email && <span>{settings.contact_email}</span>}{settings.contact_phone && <span>{settings.contact_phone}</span>}{settings.social_url && <a href={settings.social_url} target="_blank" rel="noopener noreferrer">Mạng xã hội</a>}{pages.map((page) => <Link className="hover:text-[#37665b]" key={page.slug} href={`/pages/${encodeURIComponent(page.slug)}`}>{page.title}</Link>)}<Link className="font-semibold text-[#37665b] hover:underline" href="/contact">Liên hệ</Link><Link className="text-slate-400 hover:text-[#37665b]" href="/admin">Quản trị</Link></div></div></footer>;
}
