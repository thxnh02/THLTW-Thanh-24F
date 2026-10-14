"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Header from "@/components/admin/Header";
import SideBar from "@/components/admin/SideBar";

export default function AdminShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const reduceMotion = useReducedMotion();

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

  return <div className="flex h-dvh overflow-hidden bg-slate-100 text-slate-950">
    <aside className="hidden h-full w-64 shrink-0 border-r border-slate-800 md:block"><SideBar /></aside>
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <Header menuButtonRef={menuButtonRef} menuOpen={drawerOpen} onMenuClick={() => setDrawerOpen(true)} />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8"><div className="mx-auto w-full max-w-7xl">{children}</div></main>
    </div>
    <AnimatePresence>
      {drawerOpen && <motion.div animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-slate-950/55 md:hidden" exit={{ opacity: 0 }} initial={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setDrawerOpen(false); }} transition={transition}>
        <motion.aside animate={{ x: 0 }} aria-label="Admin navigation" aria-modal="true" className="h-full w-[min(86vw,20rem)] overflow-y-auto bg-[#101a2b] shadow-2xl" exit={{ x: "-100%" }} id="admin-mobile-drawer" initial={{ x: "-100%" }} ref={drawerRef} role="dialog" transition={transition}>
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-300">Navigation</p><button aria-label="Close navigation menu" className="grid h-11 w-11 place-items-center rounded-lg text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => setDrawerOpen(false)} ref={closeButtonRef} type="button">×</button></div>
          <SideBar mobile onNavigate={() => setDrawerOpen(false)} />
        </motion.aside>
      </motion.div>}
    </AnimatePresence>
  </div>;
}
