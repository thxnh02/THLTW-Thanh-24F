"use client";

import { useEffect, useState } from "react";
import brandServices from "@/services/brandServices";

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { brandServices.getBrands().then((response) => setBrands(response.data.data ?? [])).catch(() => setError("Không tải được thương hiệu. Kiểm tra Laravel API.")); }, []);
  return <section className="space-y-8">
    <div className="rounded-[1.75rem] bg-[#f5eee7] p-8 sm:p-11"><p className="eyebrow">Thương hiệu đồng hành</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#19352f]">Những cái tên đáng tin</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Tìm hiểu các thương hiệu công nghệ đang có mặt trong bộ sưu tập CT_24F.</p></div>
    {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {brands.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{brands.map((brand, index) => <article className="rounded-[1.4rem] border border-[#e7ece8] bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg" key={brand.id}><div className="flex items-center gap-4"><div className={`grid h-14 w-14 place-items-center rounded-2xl ${index % 2 ? "bg-[#f4e9df]" : "bg-[#eaf1eb]"} bg-cover bg-center text-lg font-semibold text-[#37665b]`} style={brand.logo ? { backgroundImage: `url("${brand.logo}")` } : undefined}>{brand.logo ? <span className="sr-only">Biểu trưng {brand.name}</span> : brand.name.slice(0, 1)}</div><div><p className="eyebrow">Bộ sưu tập thương hiệu</p><h2 className="mt-1 text-lg font-semibold text-[#19352f]">{brand.name}</h2></div></div><p className="mt-5 text-sm leading-6 text-slate-500">{brand.description || "Khám phá sản phẩm từ thương hiệu này."}</p></article>)}</div> : !error && <p className="py-12 text-center text-sm text-slate-500">Đang tải thương hiệu...</p>}
  </section>;
}
