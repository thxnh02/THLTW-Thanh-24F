"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Boxes, Building2, Package, Store } from "lucide-react";

const cards = [
  { href: "/admin/category", title: "Category", detail: "Structure the catalog with parent and child categories.", icon: Boxes, tone: "from-indigo-50 to-white" },
  { href: "/admin/brand", title: "Brand", detail: "Maintain brand profiles and storefront visibility.", icon: Building2, tone: "from-sky-50 to-white" },
  { href: "/admin/product", title: "Product", detail: "Update product details, pricing, and availability.", icon: Package, tone: "from-violet-50 to-white" },
];

export default function AdminPage() {
  const reduceMotion = useReducedMotion();
  return <section className="space-y-8">
    <motion.header animate={{ opacity: 1, y: 0 }} className="relative isolate overflow-hidden rounded-3xl bg-[#101a2b] p-6 text-white shadow-xl sm:p-9 lg:p-12" initial={reduceMotion ? false : { opacity: 0, y: 12 }} transition={{ duration: reduceMotion ? 0 : 0.35 }}>
      <div aria-hidden="true" className="absolute -right-16 -top-20 -z-10 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 right-1/3 -z-10 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="relative max-w-2xl"><p className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.18em] text-indigo-200">CT_24F · Catalog workspace</p><h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">A clear view of your catalog.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Manage categories, brands, and products from one focused workspace. No sample analytics—just the tools for the catalog.</p><div className="mt-7 flex flex-wrap gap-3"><Link className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" href="/admin/product/create">Create a product <ArrowUpRight aria-hidden="true" size={16} /></Link><Link className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" href="/">View storefront <Store aria-hidden="true" size={16} /></Link></div></div>
    </motion.header>
    <div><div className="mb-4"><p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-700">Catalog tools</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Choose a section</h2></div><div className="grid gap-4 lg:grid-cols-3">{cards.map(({ href, title, detail, icon: Icon, tone }, index) => <motion.article animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${tone} p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6`} initial={reduceMotion ? false : { opacity: 0, y: 10 }} key={href} transition={{ delay: reduceMotion ? 0 : index * 0.06, duration: reduceMotion ? 0 : 0.25 }}><span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-indigo-700 shadow-sm"><Icon aria-hidden="true" size={20} /></span><h3 className="mt-5 text-lg font-semibold text-slate-950">{title}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-slate-600">{detail}</p><Link className="mt-5 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline focus-visible:outline-2" href={href}>Open {title.toLowerCase()} <ArrowUpRight aria-hidden="true" size={15} /></Link></motion.article>)}</div></div>
  </section>;
}
