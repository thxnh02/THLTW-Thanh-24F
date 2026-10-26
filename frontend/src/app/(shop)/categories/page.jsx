"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import categoryServices from "@/services/categoryServices";
import { catalogImageUrl } from "@/lib/catalogImage";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { categoryServices.getCategories().then((response) => setCategories(response.data.data ?? [])).catch(() => setError("Không tải được danh mục. Kiểm tra Laravel API.")); }, []);

  return <section className="space-y-8">
    <div className="rounded-[1.75rem] bg-[#eaf1eb] p-8 sm:p-11"><p className="eyebrow">Tìm điều phù hợp với bạn</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#19352f]">Danh mục sản phẩm</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Khám phá thiết bị theo nhu cầu — từ công việc mỗi ngày đến những món phụ kiện nhỏ nhưng hữu ích.</p></div>
    {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {categories.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category, index) => <Link className={`category-tile category-tile-${index % 4} block`} href="/products" key={category.id}><span className="category-icon bg-cover bg-center" style={category.image ? { backgroundImage: `url("${catalogImageUrl(category.image)}")`, color: "transparent" } : undefined}>{["✳", "◉", "▱", "⌁"][index % 4]}</span><h2 className="mt-7 text-xl font-semibold text-[#19352f]">{category.name}</h2><p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">{category.description || "Sản phẩm được tuyển chọn theo danh mục."}</p>{category.children?.length > 0 && <p className="mt-4 text-xs font-medium text-[#54776d]">{category.children.map((child) => child.name).join(" · ")}</p>}<span className="mt-5 block text-sm font-semibold text-[#37665b]">Xem sản phẩm ↗</span></Link>)}</div> : !error && <p className="py-12 text-center text-sm text-slate-500">Đang tải danh mục...</p>}
  </section>;
}
