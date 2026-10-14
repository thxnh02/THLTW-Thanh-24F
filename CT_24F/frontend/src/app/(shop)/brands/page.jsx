"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import brandServices from "@/services/brandServices";

function BrandMark({ brand, index }) {
  const [failed, setFailed] = useState(false);
  const tone = index % 2 ? "bg-sky-50 text-sky-700" : "bg-indigo-50 text-indigo-700";
  return <div className={`grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl ${tone}`}>
    {brand.logo && !failed ? <Image alt={`${brand.name} logo`} className="h-full w-full object-contain p-2" height={56} src={brand.logo} unoptimized width={56} onError={() => setFailed(true)} /> : <span aria-hidden="true" className="text-lg font-semibold">{brand.name?.slice(0, 1) || <Building2 size={20} />}</span>}
  </div>;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    brandServices.getBrands().then((response) => {
      if (current) setBrands(response.data.data ?? []);
    }).catch(() => {
      if (current) setError("Không tải được thương hiệu. Kiểm tra Laravel API.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, []);

  return <section className="space-y-7">
    <header className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-6 sm:p-9"><p className="eyebrow">Thương hiệu đồng hành</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Thương hiệu</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Thông tin thương hiệu được lấy trực tiếp từ danh mục cửa hàng CT_24F.</p></header>
    {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</p>}
    {brands.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{brands.map((brand, index) => <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6" key={brand.id}><div className="flex items-center gap-4"><BrandMark brand={brand} index={index} /><div className="min-w-0"><p className="eyebrow">Brand</p><h2 className="mt-1 truncate text-lg font-semibold text-slate-950">{brand.name}</h2></div></div><p className="mt-5 min-h-10 text-sm leading-6 text-slate-600">{brand.description || "Thông tin sản phẩm của thương hiệu này sẽ xuất hiện trong danh mục sản phẩm."}</p></article>)}</div> : !error && <div aria-live="polite" className="rounded-2xl border border-dashed border-slate-300 py-14 text-center text-sm text-slate-500">{loading ? "Đang tải thương hiệu..." : "Chưa có thương hiệu để hiển thị."}</div>}
  </section>;
}
