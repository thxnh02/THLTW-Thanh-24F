"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, ChevronRight } from "lucide-react";
import ProductCard, { formatPrice } from "@/components/shop/ProductCard";
import { catalogImageUrl } from "@/lib/catalogImage";
import productServices from "@/services/productServices";

function isOnSale(product) {
  return product?.sale_price != null && Number(product.sale_price) >= 0 && Number(product.sale_price) < Number(product.price);
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  const requestKey = `${slug ?? ""}:${retry}`;
  const loading = !result || result.key !== requestKey;
  const product = loading ? null : result.product;
  const related = loading ? [] : result.related;
  const error = loading ? "" : result.error;

  useEffect(() => {
    if (!slug) return undefined;
    let active = true;
    const controller = new AbortController();
    productServices.getPublicProduct(slug, { signal: controller.signal }).then(({ data }) => {
      if (!active) return;
      const current = data.data;
      setResult({ key: requestKey, product: current, related: [], error: "" });
      productServices.getRelatedProducts(slug, { limit: 4 }, { signal: controller.signal })
        .then((response) => {
          if (active) setResult({ key: requestKey, product: current, related: Array.isArray(response.data.data) ? response.data.data : [], error: "" });
        })
        .catch((requestError) => {
          if (active && requestError.code !== "ERR_CANCELED") setResult((previous) => previous?.key === requestKey ? { ...previous, related: [] } : previous);
        });
    }).catch((requestError) => {
      if (!active || requestError.code === "ERR_CANCELED") return;
      setResult({ key: requestKey, product: null, related: [], error: requestError.response?.status === 404 ? "Không tìm thấy sản phẩm này." : "Không thể tải sản phẩm. Vui lòng thử lại." });
    });

    return () => { active = false; controller.abort(); };
  }, [slug, retry, requestKey]);

  const retryLoad = () => setRetry((value) => value + 1);

  if (loading) return <section aria-live="polite" className="rounded-2xl border border-dashed border-[#d6dfd9] p-8 text-center text-sm text-slate-500" role="status">Đang tải thông tin sản phẩm…</section>;
  if (error) return <section className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center" role="alert"><p className="text-lg font-semibold text-rose-900">{error}</p>{error !== "Không tìm thấy sản phẩm này." && <button className="mt-4 min-h-11 rounded-full bg-[#193f36] px-5 text-sm font-semibold text-white" onClick={retryLoad} type="button">Thử lại</button>}<Link className="mt-4 flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-[#37665b]" href="/products"><ArrowLeft aria-hidden="true" size={16} /> Trở lại sản phẩm</Link></section>;
  if (!product) return null;

  const onSale = isOnSale(product);
  const imageUrl = catalogImageUrl(product.image);
  const categoryHref = product.category?.id ? `/products?category_id=${product.category.id}` : "/products";
  const brandHref = product.brand?.id ? `/products?brand_id=${product.brand.id}` : "/products";

  return <div className="space-y-8 pb-10">
    <nav aria-label="Đường dẫn" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
      <Link className="min-h-10 inline-flex items-center hover:text-[#37665b]" href="/">Trang chủ</Link><ChevronRight aria-hidden="true" size={15} />
      <Link className="min-h-10 inline-flex items-center hover:text-[#37665b]" href="/products">Sản phẩm</Link><ChevronRight aria-hidden="true" size={15} />
      {product.category?.name && <><Link className="min-h-10 inline-flex items-center hover:text-[#37665b]" href={categoryHref}>{product.category.name}</Link><ChevronRight aria-hidden="true" size={15} /></>}
      <span aria-current="page" className="max-w-full truncate font-medium text-[#19352f]">{product.name}</span>
    </nav>

    <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-7">
      <div aria-label={imageUrl ? `Ảnh ${product.name}` : `Chưa có ảnh cho ${product.name}`} className="relative flex aspect-[4/3] w-full max-w-[560px] items-center justify-center overflow-hidden rounded-2xl border border-[#e4ebe5] bg-gradient-to-br from-[#eaf1eb] to-[#d5e3d8]" role="img" style={imageUrl ? { backgroundImage: `linear-gradient(#142f2c08,#142f2c08), url("${imageUrl}")`, backgroundPosition: "center", backgroundSize: "contain", backgroundRepeat: "no-repeat" } : undefined}>
        {!imageUrl && <span aria-hidden="true" className="font-serif text-8xl italic text-[#244941]/20">{product.name?.charAt(0) ?? "✳"}</span>}
        {onSale && <span className="absolute left-4 top-4 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">Đang khuyến mãi</span>}
      </div>

      <div className="rounded-2xl border border-[#e4ebe5] bg-white p-5 shadow-sm sm:p-6">
        <p className="eyebrow">Chi tiết sản phẩm</p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-[#19352f] sm:text-3xl">{product.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {product.brand?.name ? <Link className="min-h-10 inline-flex items-center rounded-full bg-[#eaf1eb] px-4 font-medium text-[#37665b] hover:bg-[#dfeae1]" href={brandHref}>{product.brand.name}</Link> : <span className="text-slate-500">Chưa gán thương hiệu</span>}
          {product.category?.name && <Link className="min-h-10 inline-flex items-center gap-1 text-[#37665b] hover:underline" href={categoryHref}>{product.category.name}<ArrowUpRight aria-hidden="true" size={14} /></Link>}
        </div>
        <div className="mt-5 border-y border-[#edf1ed] py-4">
          <p className={`text-2xl font-bold ${onSale ? "text-rose-700" : "text-[#37665b]"}`}>{formatPrice(onSale ? product.sale_price : product.price)}</p>
          {onSale && <p className="mt-1 text-sm text-slate-500">Giá gốc <span className="ml-1 line-through">{formatPrice(product.price)}</span></p>}
        </div>
        <div className="py-4">
          <h2 className="text-base font-semibold text-[#19352f]">Mô tả</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{product.description?.trim() || "Chưa có mô tả cho sản phẩm này."}</p>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-[#edf1ed] pt-5">
          {product.category?.name && <Link className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#193f36] px-5 text-sm font-semibold text-white transition hover:bg-[#28564d]" href={categoryHref}>Xem thêm {product.category.name}<ArrowUpRight aria-hidden="true" size={16} /></Link>}
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d8e2da] px-5 text-sm font-semibold text-[#37665b] hover:bg-[#f4f7f4]" href="/products"><ArrowLeft aria-hidden="true" size={16} /> Tất cả sản phẩm</Link>
        </div>
      </div>
    </section>

    {related.length > 0 && <section aria-labelledby="related-products-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Cùng danh mục hoặc thương hiệu</p><h2 className="section-title" id="related-products-heading">Sản phẩm liên quan</h2></div>{product.category?.name && <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#37665b] hover:underline" href={categoryHref}>Xem danh mục<ArrowUpRight aria-hidden="true" size={15} /></Link>}</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div>
    </section>}
  </div>;
}
