"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Boxes, LayoutGrid } from "lucide-react";
import categoryServices from "@/services/categoryServices";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    categoryServices.getCategories().then((response) => {
      if (current) setCategories(response.data.data ?? []);
    }).catch(() => {
      if (current) setError("Không tải được danh mục. Kiểm tra Laravel API.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, []);

  return <section className="space-y-7">
    <header className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 sm:p-9"><p className="eyebrow">Tìm điều phù hợp với bạn</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Danh mục sản phẩm</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Khám phá thiết bị theo nhu cầu — từ công việc mỗi ngày đến những món phụ kiện nhỏ nhưng hữu ích.</p></header>
    {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</p>}
    {categories.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category, index) => <Link className={`category-tile category-tile-${index % 4} group block`} href="/products" key={category.id}><span className="category-icon"><Boxes aria-hidden="true" size={21} strokeWidth={1.8} /></span><h2 className="mt-7 text-xl font-semibold text-slate-950">{category.name}</h2><p className="mt-2 min-h-10 text-sm leading-5 text-slate-600">{category.description || "Sản phẩm được sắp xếp trong danh mục này."}</p>{category.children?.length > 0 && <p className="mt-4 text-xs font-medium text-slate-500">{category.children.map((child) => child.name).join(" · ")}</p>}<span className="mt-5 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-indigo-700">Xem sản phẩm <ArrowUpRight aria-hidden="true" className="transition group-hover:translate-x-0.5" size={15} /></span></Link>)}</div> : !error && <div aria-live="polite" className="rounded-2xl border border-dashed border-slate-300 py-14 text-center text-sm text-slate-500">{loading ? "Đang tải danh mục..." : <><LayoutGrid className="mx-auto mb-3 text-slate-400" size={22} />Chưa có danh mục để hiển thị.</>}</div>}
  </section>;
}
