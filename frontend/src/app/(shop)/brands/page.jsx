"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import brandServices from "@/services/brandServices";
import { catalogImageUrl } from "@/lib/catalogImage";
import { brandProductsHref } from "@/lib/shopSearch.mjs";

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    brandServices.getBrands()
      .then((response) => { if (current) setBrands(response.data.data ?? []); })
      .catch(() => { if (current) setError("Không tải được thương hiệu. Kiểm tra kết nối rồi thử lại."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  return <section className="space-y-6 sm:space-y-7">
    <header className="rounded-2xl border border-[#eee5dc] bg-[#f5eee7] px-5 py-5 sm:px-7 sm:py-6">
      <p className="eyebrow">Thương hiệu đồng hành</p>
      <h1 className="section-title">Thương hiệu công nghệ</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Khám phá sản phẩm từ các thương hiệu đang có trong cửa hàng.</p>
    </header>
    {error && <p className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>}
    {loading ? <p aria-live="polite" className="rounded-2xl border border-dashed border-[#d6dfd9] p-10 text-center text-sm text-slate-500">Đang tải thương hiệu…</p> : brands.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {brands.map((brand, index) => <Link className="group rounded-2xl border border-[#e1e9e2] bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#c6d8cb] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#37665b] motion-reduce:transition-none" href={brandProductsHref(brand.id)} key={brand.id}>
        <div className="flex items-center gap-4">
          <div aria-hidden={Boolean(brand.logo)} className={`grid size-12 shrink-0 place-items-center rounded-xl ${index % 2 ? "bg-[#f4e9df]" : "bg-[#eaf1eb]"} bg-cover bg-center text-base font-semibold text-[#37665b]`} style={brand.logo ? { backgroundImage: `url("${catalogImageUrl(brand.logo)}")` } : undefined}>{brand.logo ? <span className="sr-only">Biểu trưng {brand.name}</span> : brand.name.slice(0, 1)}</div>
          <div className="min-w-0"><p className="eyebrow">Thương hiệu</p><h2 className="mt-1 truncate text-lg font-semibold text-[#19352f]">{brand.name}</h2></div>
        </div>
        <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{brand.description || "Khám phá sản phẩm từ thương hiệu này."}</p>
        <span className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-[#37665b] group-hover:text-[#19352f]">Xem sản phẩm <span aria-hidden="true" className="ml-1">↗</span></span>
      </Link>)}
    </div> : !error && <p className="rounded-2xl border border-dashed border-[#d6dfd9] p-10 text-center text-sm text-slate-500">Chưa có thương hiệu nào được hiển thị.</p>}
  </section>;
}
