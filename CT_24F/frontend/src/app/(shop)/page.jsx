"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Cable, Laptop, LayoutGrid, Smartphone, Sparkles } from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import categoryServices from "@/services/categoryServices";
import productServices from "@/services/productServices";

const categoryIcons = { "dien-thoai": Smartphone, laptop: Laptop, "phu-kien": Cable, "sac-va-cap": Cable };

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let current = true;
    Promise.all([categoryServices.getCategories(), productServices.getProducts({ page: 1 })])
      .then(([categoryResponse, productResponse]) => {
        if (!current) return;
        setCategories(categoryResponse.data.data ?? []);
        setProducts(productResponse.data.data ?? []);
      })
      .catch(() => { if (current) setError("Chưa kết nối được cửa hàng. Hãy kiểm tra Laravel API đang chạy."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  const reveal = reduceMotion ? false : { opacity: 0, y: 14 };
  return <div className="space-y-14 pb-10 sm:space-y-16">
    <motion.section animate={{ opacity: 1, y: 0 }} className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#101a2b] px-6 py-12 text-white shadow-xl sm:px-10 sm:py-16 lg:px-14 lg:py-20" initial={reveal} transition={{ duration: reduceMotion ? 0 : 0.35 }}>
      <div aria-hidden="true" className="absolute -right-20 -top-24 -z-10 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-40 right-1/3 -z-10 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl" />
      <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.18em] text-indigo-200"><Sparkles aria-hidden="true" size={13} /> CT_24F · tuyển chọn mỗi ngày</p>
      <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">Công nghệ tốt.<br /><span className="font-serif italic text-indigo-200">Cuộc sống nhẹ tênh.</span></h1>
      <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">Những thiết bị và phụ kiện hữu ích, được chọn lọc để đồng hành cùng nhịp sống của bạn.</p>
      <div className="mt-8 flex flex-wrap gap-3"><Link className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" href="/products">Khám phá sản phẩm <ArrowUpRight aria-hidden="true" size={16} /></Link><Link className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" href="/categories">Xem danh mục</Link></div>
      <div className="mt-10 flex items-center gap-3 text-xs text-slate-400"><span className="h-px w-10 bg-indigo-300" /> Thiết kế tinh gọn · Chọn lựa có gu</div>
    </motion.section>

    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Khám phá theo nhu cầu</p><h2 className="section-title">Danh mục nổi bật</h2></div><Link className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline focus-visible:outline-2" href="/categories">Tất cả danh mục <ArrowUpRight aria-hidden="true" size={15} /></Link></div>
      {categories.length ? <motion.div animate="show" className="grid grid-cols-2 gap-3 md:grid-cols-4" initial="hidden" variants={{ show: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } } }}>{categories.slice(0, 4).map((category, index) => { const Icon = categoryIcons[category.slug] ?? LayoutGrid; return <motion.div key={category.id} variants={{ hidden: reduceMotion ? {} : { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.2 } } }}><Link className={`category-tile category-tile-${index} group block`} href="/products"><span className="category-icon"><Icon aria-hidden="true" size={21} strokeWidth={1.8} /></span><span className="mt-7 block text-base font-semibold text-slate-900 sm:text-lg">{category.name}</span><span className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">Khám phá ngay <ArrowUpRight aria-hidden="true" className="transition group-hover:translate-x-0.5" size={14} /></span></Link></motion.div>; })}</motion.div> : <p aria-live="polite" className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{loading ? "Đang tải danh mục..." : error || "Chưa có danh mục để hiển thị."}</p>}
    </section>

    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Từ dữ liệu cửa hàng</p><h2 className="section-title">Sản phẩm mới nhất</h2></div><Link className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline focus-visible:outline-2" href="/products">Xem tất cả <ArrowUpRight aria-hidden="true" size={15} /></Link></div>
      {products.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{products.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p aria-live="polite" className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{loading ? "Đang tải sản phẩm..." : error || "Chưa có sản phẩm để hiển thị."}</p>}
    </section>

    <section className="flex flex-col justify-between gap-5 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-6 sm:flex-row sm:items-center sm:p-8"><div><p className="eyebrow">Dành cho quản trị viên</p><h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">Quản lý danh mục, thương hiệu và sản phẩm.</h2></div><Link className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-[#101a2b] px-5 text-sm font-semibold text-white transition hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href="/admin">Mở trang quản trị <ArrowUpRight aria-hidden="true" size={16} /></Link></section>
  </div>;
}
