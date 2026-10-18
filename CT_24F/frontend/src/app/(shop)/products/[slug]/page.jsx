"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { catalogImageUrl } from "@/lib/catalogImage";
import { formatPrice } from "@/components/shop/ProductCard";
import productServices from "@/services/productServices";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    productServices.getProductBySlug(slug).then(r => { if(active) setProduct(r.data.data); })
      .catch(e => { if(active) setError(e.response?.status === 404 ? "Không tìm thấy sản phẩm." : "Không thể tải sản phẩm."); })
      .finally(() => { if(active) setLoading(false); });
    return () => {active = false;};
  }, [slug]);
  return <section className="space-y-8">
    <nav className="text-sm text-slate-500"><Link className="hover:underline" href="/products">Sản phẩm</Link> / {product?.name ?? "Chi tiết"}</nav>
    {loading && <p className="rounded-xl bg-white p-8">Đang tải sản phẩm…</p>}
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-8 text-rose-800">{error}</p>}
    {product && <div className="grid gap-9 lg:grid-cols-2">
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-[#eaf1eb]">
        {product.image ? <img className="h-full w-full object-contain" alt={product.name} src={catalogImageUrl(product.image)} /> : <span className="font-serif text-8xl text-emerald-800/30">{product.name?.[0]}</span>}
      </div>
      <div className="space-y-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#37665b]">{product.brand?.name ?? "Sản phẩm"}</p>
        <h1 className="text-3xl font-bold tracking-tight text-[#19352f] sm:text-4xl">{product.name}</h1>
        <p className="text-sm text-slate-500">{product.category?.name}{product.sku ? " · SKU: " + product.sku : ""}</p>
        <div className="flex flex-wrap items-center gap-4">
          <strong className="text-3xl text-[#1a6250]">{formatPrice(product.sale_price ?? product.price)}</strong>
          {product.sale_price != null && <del className="text-lg text-slate-400">{formatPrice(product.price)}</del>}
        </div>
        <p className={Number(product.quantity) === 0 ? "font-semibold text-rose-700" : "text-slate-600"}>{Number(product.quantity) === 0 ? "Hết hàng" : "Còn " + product.quantity + " sản phẩm"}</p>
        {product.short_description && <p className="text-slate-700">{product.short_description}</p>}
        {product.description && <p className="whitespace-pre-wrap leading-7 text-slate-600">{product.description}</p>}
        <p className="rounded-xl border border-dashed p-4 text-sm text-slate-500">Giỏ hàng và thanh toán sẽ được kết nối trong các buổi học tiếp theo.</p>
      </div>
    </div>}
  </section>;
}
