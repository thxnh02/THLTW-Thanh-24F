"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const palettes = ["from-indigo-50 to-indigo-100", "from-sky-50 to-sky-100", "from-violet-50 to-violet-100", "from-slate-50 to-slate-200"];

export function formatPrice(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 2 }).format(Number(value ?? 0));
}

export default function ProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const reduceMotion = useReducedMotion();
  return <motion.article animate={{ opacity: 1, y: 0 }} className="product-card group overflow-hidden rounded-2xl border border-slate-200 bg-white" initial={reduceMotion ? false : { opacity: 0, y: 8 }} transition={{ duration: reduceMotion ? 0 : 0.22 }}>
    <div className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br ${palettes[(Number(product.id) || 0) % palettes.length]}`}>
      {product.image && !imageFailed ? <Image alt="" className="object-cover transition duration-500 group-hover:scale-[1.03]" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" src={product.image} unoptimized onError={() => setImageFailed(true)} /> : <div aria-hidden="true" className="flex flex-col items-center gap-2 text-indigo-400/70"><ImageOff size={24} strokeWidth={1.5} /><span className="font-serif text-6xl italic">{product.name?.charAt(0) ?? "C"}</span></div>}
      {product.category?.name && <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[10px] font-semibold text-indigo-800 backdrop-blur">{product.category.name}</span>}
    </div>
    <div className="p-4 sm:p-5"><p className="truncate text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">{product.brand?.name ?? "No brand"}</p><h3 className="mt-2 line-clamp-2 min-h-12 text-[15px] font-semibold leading-6 text-slate-900">{product.name}</h3><div className="mt-3 border-t border-slate-100 pt-3"><p className="text-sm font-bold text-indigo-700">{formatPrice(product.price)}</p></div></div>
  </motion.article>;
}
