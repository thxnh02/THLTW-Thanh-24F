"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import categoryServices from "@/services/categoryServices";
import { catalogImageUrl } from "@/lib/catalogImage";
import { categoryProductsHref } from "@/lib/shopSearch.mjs";

const icons = ["✳", "◉", "▱", "⌁"];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    categoryServices.getCategories()
      .then((response) => { if (current) setCategories(response.data.data ?? []); })
      .catch(() => { if (current) setError("Không tải được danh mục. Kiểm tra kết nối rồi thử lại."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  return <section className="space-y-6 sm:space-y-7">
    <header className="rounded-2xl border border-[#e1e9e2] bg-[#eaf1eb] px-5 py-5 sm:px-7 sm:py-6">
      <p className="eyebrow">Khám phá theo nhu cầu</p>
      <h1 className="section-title">Danh mục sản phẩm</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Tìm thiết bị và phụ kiện theo từng nhóm sản phẩm.</p>
    </header>
    {error && <p className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>}
    {loading ? <p aria-live="polite" className="rounded-2xl border border-dashed border-[#d6dfd9] p-10 text-center text-sm text-slate-500">Đang tải danh mục…</p> : categories.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category, index) => <Link className={`category-tile category-tile-${index % 4} block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2`} href={categoryProductsHref(category.id)} key={category.id}>
        <span aria-hidden="true" className="category-icon bg-cover bg-center" style={category.image ? { backgroundImage: `url("${catalogImageUrl(category.image)}")`, color: "transparent" } : undefined}>{icons[index % icons.length]}</span>
        <h2 className="mt-4 text-lg font-semibold text-[#19352f]">{category.name}</h2>
        <p className="mt-1 min-h-10 text-sm leading-5 text-slate-600">{category.description || "Sản phẩm được tuyển chọn theo danh mục."}</p>
        {category.children?.length > 0 && <p className="mt-3 text-xs leading-5 text-[#54776d]">Gồm: {category.children.map((child) => child.name).join(" · ")}</p>}
        <span className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-[#37665b]">Xem sản phẩm <span aria-hidden="true" className="ml-1">↗</span></span>
      </Link>)}
    </div> : !error && <p className="rounded-2xl border border-dashed border-[#d6dfd9] p-10 text-center text-sm text-slate-500">Chưa có danh mục nào được hiển thị.</p>}
  </section>;
}
