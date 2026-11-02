"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Header from "@/components/admin/Header";
import SideBar from "@/components/admin/SideBar";
import adminAuthServices from '@/services/adminAuthServices';
import { safeAdminReturnTo } from '@/lib/adminAuthHelpers.mjs';

export default function AdminShell({ children }) {
  const pathname = usePathname() ?? '/admin';
  const router = useRouter();
  const isLogin = pathname === '/admin/login';
  const [session, setSession] = useState({ path: null, status: 'loading', user: null });
  const [retry, setRetry] = useState(0);
  const [logoutError, setLogoutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (isLogin) return undefined;
    let active = true;
    adminAuthServices.me().then((response) => {
      if (active) setSession({ path: pathname, status: 'allowed', user: response.data?.data?.user ?? null });
    }).catch((error) => {
      if (!active) return;
      const status = error.response?.status;
      setSession({ path: pathname, status: status === 403 ? 'denied' : status === 401 ? 'signed-out' : 'error', user: null });
      if (status === 401) router.replace(`/admin/login?returnTo=${encodeURIComponent(safeAdminReturnTo(pathname))}`);
    });
    return () => { active = false; };
  }, [isLogin, pathname, retry, router]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const menuButton = menuButtonRef.current;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = drawerRef.current?.querySelectorAll("a[href], button:not([disabled])");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      menuButton?.focus();
    };
  }, [drawerOpen]);

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" };

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true); setLogoutError('');
    try { await adminAuthServices.logout(); setSession({ path: null, status: 'loading', user: null }); router.replace('/admin/login'); }
    catch { setLogoutError('Không thể đăng xuất lúc này. Vui lòng thử lại.'); setSigningOut(false); }
  };

  if (isLogin) return children;
  if (session.path !== pathname || session.status === 'loading') {
    return <div aria-live="polite" className="grid min-h-dvh place-items-center bg-slate-100 p-6 text-sm text-slate-600">Đang kiểm tra quyền quản trị…</div>;
  }
  if (session.status === 'signed-out') return <div className="grid min-h-dvh place-items-center bg-slate-100 p-6 text-center text-sm text-slate-600"><div><p>Phiên quản trị đã hết hạn.</p><Link className="mt-3 inline-flex min-h-11 items-center font-semibold text-indigo-700 underline" href="/admin/login">Đến trang đăng nhập</Link></div></div>;
  if (session.status === 'denied') return <div className="grid min-h-dvh place-items-center bg-slate-100 p-6"><div className="max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm"><h1 className="text-xl font-semibold text-slate-900">Không có quyền quản trị</h1><p className="mt-2 text-sm text-slate-600">Tài khoản hiện tại không được phép truy cập trang này.</p><Link className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-indigo-700 px-5 text-sm font-semibold text-white" href="/admin/login">Đăng nhập bằng tài khoản admin</Link></div></div>;
  if (session.status === 'error') return <div className="grid min-h-dvh place-items-center bg-slate-100 p-6"><div className="max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm"><h1 className="text-xl font-semibold text-slate-900">Chưa kiểm tra được quyền truy cập</h1><p className="mt-2 text-sm text-slate-600">Kiểm tra kết nối với máy chủ rồi thử lại.</p><button className="mt-5 min-h-11 rounded-xl bg-indigo-700 px-5 text-sm font-semibold text-white" onClick={() => { setSession({ path: null, status: 'loading', user: null }); setRetry((value) => value + 1); }} type="button">Thử lại</button></div></div>;

  return <div className="flex h-dvh overflow-hidden bg-slate-100 text-slate-950">
    <aside className="hidden h-full w-64 shrink-0 border-r border-slate-800 md:block"><SideBar /></aside>
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <Header adminName={session.user?.name} menuButtonRef={menuButtonRef} menuOpen={drawerOpen} onMenuClick={() => setDrawerOpen(true)} onSignOut={signOut} signingOut={signingOut} />
      {logoutError && <p className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700" role="alert">{logoutError}</p>}
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8"><div className="mx-auto w-full max-w-7xl">{children}</div></main>
    </div>
    <AnimatePresence>
      {drawerOpen && <motion.div animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-slate-950/55 md:hidden" exit={{ opacity: 0 }} initial={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setDrawerOpen(false); }} transition={transition}>
        <motion.aside animate={{ x: 0 }} aria-label="Điều hướng quản trị" aria-modal="true" className="h-full w-[min(86vw,20rem)] overflow-y-auto bg-[#101a2b] shadow-2xl" exit={{ x: "-100%" }} id="admin-mobile-drawer" initial={{ x: "-100%" }} ref={drawerRef} role="dialog" transition={transition}>
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-300">Điều hướng</p><button aria-label="Đóng menu điều hướng" className="grid h-11 w-11 place-items-center rounded-lg text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => setDrawerOpen(false)} ref={closeButtonRef} type="button">×</button></div>
          <SideBar mobile onNavigate={() => setDrawerOpen(false)} />
        </motion.aside>
      </motion.div>}
    </AnimatePresence>
  </div>;
}
