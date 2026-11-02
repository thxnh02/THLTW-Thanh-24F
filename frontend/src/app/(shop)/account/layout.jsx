"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LockKeyhole, MapPin, UserRound } from 'lucide-react';
import CustomerAvatar from '@/components/shop/CustomerAvatar';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

const sections = [
  ['/account', 'Hồ sơ', UserRound],
  ['/account/addresses', 'Địa chỉ', MapPin],
  ['/account/security', 'Bảo mật', LockKeyhole],
];

export default function AccountLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, authError, refreshUser } = useCustomerAuth();

  useEffect(() => {
    if (!loading && !authError && !user) router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
  }, [authError, loading, pathname, router, user]);

  if (loading) return <div aria-live="polite" className="mx-auto max-w-[1120px] animate-pulse space-y-5 py-8"><div className="h-7 w-48 rounded bg-[#e5ece7]" /><div className="h-72 rounded-2xl bg-[#edf2ee]" /></div>;
  if (authError && !user) return <div className="mx-auto max-w-lg rounded-2xl border border-[#e2e9e3] bg-white p-6 text-center"><h1 className="text-xl font-semibold text-[#19352f]">Chưa tải được tài khoản</h1><p className="mt-2 text-sm text-slate-600">Kiểm tra kết nối với máy chủ rồi thử lại.</p><button className="mt-4 min-h-11 rounded-xl bg-[#193f36] px-5 text-sm font-semibold text-white" onClick={() => refreshUser().catch(() => {})} type="button">Thử lại</button></div>;
  if (!user) return <p aria-live="polite" className="py-10 text-center text-sm text-slate-500">Đang chuyển đến trang đăng nhập…</p>;

  return <div className="mx-auto max-w-[1140px] pb-12">
    <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#547268]">Tài khoản CT_24F</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#19352f] sm:text-3xl">Tài khoản của bạn</h1></div>
    <div className="grid gap-5 md:grid-cols-[224px_minmax(0,1fr)] md:items-start lg:gap-7">
      <aside className="rounded-2xl border border-[#e3ebe5] bg-white p-3 shadow-sm">
        <div className="hidden items-center gap-3 border-b border-[#edf0ed] px-2 py-3 md:flex"><CustomerAvatar size="size-11" user={user} /><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#19352f]">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div></div>
        <nav aria-label="Điều hướng tài khoản" className="grid grid-cols-3 gap-1 md:mt-2 md:grid-cols-1">{sections.map(([href, label, Icon]) => <Link aria-current={pathname === href ? 'page' : undefined} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-[#37665b] md:justify-start md:px-3 ${pathname === href ? 'bg-[#e8f0e9] text-[#193f36]' : 'text-slate-600 hover:bg-[#f5f8f5]'}`} href={href} key={href}><Icon aria-hidden="true" className="size-4" />{label}</Link>)}</nav>
      </aside>
      <div className="min-w-0 space-y-5">{children}</div>
    </div>
  </div>;
}
