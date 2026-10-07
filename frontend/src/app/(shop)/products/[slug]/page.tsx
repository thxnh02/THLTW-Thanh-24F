"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Minus, PackageCheck, Plus, RotateCcw, ShieldCheck, ShoppingCart, Star, Truck } from "lucide-react";
import { ProductCard } from "@/components/shop/product/ProductCard";
import { Badge, Button, EmptyState, ErrorState, Input, SectionCard, Select, Skeleton, Textarea } from "@/components/ui";
import { useCart } from "@/contexts/CartContext";
import { apiGet, apiPost } from "@/lib/api";
import type { Product, ProductImage, ProductVariant } from "@/types/api";
import { formatVnd } from "@/lib/format";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

type ReviewForm = {
  rating: string;
  content: string;
};

const trustItems = [
  { icon: ShieldCheck, title: "Sản phẩm chính hãng", detail: "Nguồn gốc rõ ràng" },
  { icon: Truck, title: "Giao hàng toàn quốc", detail: "Theo dõi đơn thuận tiện" },
  { icon: RotateCcw, title: "Đổi trả 7 ngày", detail: "Hỗ trợ nhanh chóng" },
  { icon: PackageCheck, title: "Đóng gói cẩn thận", detail: "Bảo vệ thiết bị an tâm" },
];

export default function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = use(params);
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [review, setReview] = useState<ReviewForm>({ rating: "5", content: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void apiGet<Product>(`/products/${slug}`)
      .then((data) => {
        if (!active) return;
        setError("");
        const firstVariant = data.default_variant ?? data.variants?.[0] ?? null;
        const firstImage = data.primary_image ?? data.images?.[0]?.path ?? "";
        setProduct(data);
        setSelectedVariantId(firstVariant?.id ?? null);
        setSelectedImage(firstImage);
        updateRecentlyViewed(data, setRecentlyViewed);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Không thể tải thông tin sản phẩm.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!product) return null;
    return product.variants?.find((variant) => variant.id === selectedVariantId) ?? product.default_variant ?? product.variants?.[0] ?? null;
  }, [product, selectedVariantId]);

  const productImages = useMemo<ProductImage[]>(() => {
    if (!product) return [];
    if (product.images?.length) return product.images;
    return product.primary_image ? [{ id: 0, product_id: product.id, path: product.primary_image, alt_text: product.name, is_primary: true }] : [];
  }, [product]);

  const selectedImageIndex = Math.max(0, productImages.findIndex((image) => image.path === selectedImage));
  const stock = Number(selectedVariant?.stock_quantity ?? product?.stock_quantity ?? 0);
  const currentPrice = selectedVariant?.sale_price ?? selectedVariant?.price ?? product?.sale_price ?? product?.price;
  const originalPrice = selectedVariant?.sale_price ? selectedVariant.price : null;
  const discount = getDiscountPercent(selectedVariant);
  const averageRating = Number(product?.average_rating ?? 0);
  const reviews = product?.reviews ?? [];

  function selectRelativeImage(offset: number) {
    if (!productImages.length) return;
    const nextIndex = (selectedImageIndex + offset + productImages.length) % productImages.length;
    setSelectedImage(productImages[nextIndex].path);
  }

  async function addProductToCart() {
    if (!product || !selectedVariant || stock <= 0) return;
    setError("");
    setMessage("");
    addItem(product, selectedVariant, Math.min(Math.max(1, quantity), stock));
    setMessage("Đã thêm sản phẩm vào giỏ hàng.");
  }

  async function addWishlist() {
    if (!product) return;
    setError("");
    setMessage("");
    try {
      await apiPost("/wishlist", { product_id: product.id });
      setMessage("Đã thêm sản phẩm vào danh sách yêu thích.");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Không thể thêm vào danh sách yêu thích.");
    }
  }

  async function submitReview() {
    if (!product) return;
    setError("");
    setMessage("");
    try {
      await apiPost(`/products/${product.id}/reviews`, { rating: Number(review.rating), content: review.content || undefined });
      setProduct(await apiGet<Product>(`/products/${slug}`));
      setReview({ rating: "5", content: "" });
      setMessage("Cảm ơn bạn đã chia sẻ trải nghiệm về sản phẩm.");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Không thể gửi đánh giá.");
    }
  }

  if (loading) return <ProductLoading />;
  if (error && !product) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ErrorState title="Không thể mở sản phẩm" message={error} onRetry={() => window.location.reload()} />
      </main>
    );
  }
  if (!product) return null;

  return (
    <main className="min-h-screen bg-[#f5f8f7] pb-20 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav aria-label="Đường dẫn trang" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/products" className="font-semibold transition hover:text-teal-700">Sản phẩm</Link>
          <span aria-hidden="true">/</span>
          {product.category ? <><span>{product.category.name}</span><span aria-hidden="true">/</span></> : null}
          <span className="max-w-[min(70vw,32rem)] truncate text-slate-900">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] xl:items-start">
          <section aria-label="Thư viện ảnh sản phẩm">
            <div className="group relative aspect-[4/3] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <Image
                src={selectedImage || "/product-placeholder.svg"}
                alt={product.name}
                fill
                priority
                unoptimized
                sizes="(max-width: 1280px) 100vw, 58vw"
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-5">
                <Badge tone="brand">{product.featured ? "Được yêu thích" : "NovaTech tuyển chọn"}</Badge>
                {discount > 0 ? <Badge tone="danger">-{discount}%</Badge> : null}
              </div>
              {productImages.length > 1 ? (
                <>
                  <button type="button" onClick={() => selectRelativeImage(-1)} aria-label="Xem ảnh trước" className="absolute left-4 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-slate-950 opacity-0 shadow-lg transition group-hover:opacity-100 focus-visible:opacity-100">
                    <ChevronLeft size={20} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => selectRelativeImage(1)} aria-label="Xem ảnh tiếp theo" className="absolute right-4 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-slate-950 opacity-0 shadow-lg transition group-hover:opacity-100 focus-visible:opacity-100">
                    <ChevronRight size={20} aria-hidden="true" />
                  </button>
                </>
              ) : null}
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {productImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedImage(image.path)}
                  aria-label={`Xem ảnh ${index + 1}`}
                  aria-current={selectedImage === image.path}
                  className={`relative size-[76px] shrink-0 overflow-hidden rounded-2xl border-2 bg-white p-0.5 transition ${selectedImage === image.path ? "border-teal-700 shadow-sm" : "border-transparent hover:border-slate-300"}`}
                >
                  <Image src={image.path} alt="" fill unoptimized sizes="76px" className="rounded-[13px] object-cover" />
                </button>
              ))}
              {!productImages.length ? <div className="flex h-[76px] items-center rounded-2xl border border-dashed border-slate-300 px-4 text-sm text-slate-500">Ảnh sản phẩm đang được cập nhật</div> : null}
            </div>
            <p className="mt-2 text-xs text-slate-500">{productImages.length ? `${productImages.length} hình ảnh sản phẩm` : "Hình ảnh đang được cập nhật"}</p>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-teal-700">{product.category?.name ?? "Thiết bị công nghệ"}{product.brand ? ` · ${product.brand.name}` : ""}</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{product.name}</h1>
              </div>
              <Button type="button" variant="secondary" onClick={() => void addWishlist()} className="size-11 shrink-0 p-0" aria-label="Thêm vào yêu thích" title="Thêm vào yêu thích">
                <Heart size={19} aria-hidden="true" />
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                <Star size={16} fill="currentColor" aria-hidden="true" /> {averageRating > 0 ? averageRating.toFixed(1) : "Mới"}
              </span>
              <span className="text-slate-400">•</span>
              <a href="#reviews" className="font-semibold text-slate-600 underline-offset-4 hover:text-teal-700 hover:underline">{product.review_count ?? 0} đánh giá</a>
              {product.updated_at ? <><span className="text-slate-400">•</span><span className="text-slate-500">Cập nhật gần đây</span></> : null}
            </div>

            <p className="mt-5 leading-7 text-slate-600">{product.short_description || "Thiết bị công nghệ được chọn lọc cho công việc, học tập và giải trí mỗi ngày."}</p>

            <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Giá tốt hôm nay</p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <p className="text-3xl font-black sm:text-4xl">{formatVnd(currentPrice)}</p>
                {originalPrice ? <p className="pb-1 text-sm text-slate-400 line-through">{formatVnd(originalPrice)}</p> : null}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span>Mã sản phẩm: <strong className="text-white">{selectedVariant?.sku ?? "Đang cập nhật"}</strong></span>
                <span className="text-slate-600">•</span>
                <span className={stock > 0 ? "text-teal-300" : "text-rose-300"}>{stock > 0 ? `Còn ${stock} sản phẩm` : "Tạm hết hàng"}</span>
              </div>
            </div>

            {product.variants?.length ? (
              <label className="mt-6 block text-sm font-bold text-slate-800">
                Phiên bản sản phẩm
                <Select value={selectedVariantId ?? ""} onChange={(event) => { setSelectedVariantId(Number(event.target.value)); setQuantity(1); }} className="mt-2 font-normal">
                  {product.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name} · {variant.sku}</option>)}
                </Select>
              </label>
            ) : null}

            <div className="mt-5 flex flex-wrap items-end gap-4">
              <div>
                <p className="mb-2 text-sm font-bold text-slate-800">Số lượng</p>
                <div className="flex h-11 items-center rounded-xl border border-slate-300 bg-white">
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} aria-label="Giảm số lượng" className="inline-flex size-10 items-center justify-center text-slate-600 transition hover:text-teal-700 disabled:opacity-40"><Minus size={16} aria-hidden="true" /></button>
                  <Input type="number" min={1} max={Math.max(1, stock)} value={quantity} onChange={(event) => setQuantity(Math.min(Math.max(1, Number(event.target.value) || 1), Math.max(1, stock)))} aria-label="Số lượng sản phẩm" className="h-9 w-14 border-0 px-0 text-center font-bold shadow-none focus-visible:ring-0" />
                  <button type="button" onClick={() => setQuantity((value) => Math.min(Math.max(1, stock), value + 1))} disabled={quantity >= stock || stock <= 0} aria-label="Tăng số lượng" className="inline-flex size-10 items-center justify-center text-slate-600 transition hover:text-teal-700 disabled:opacity-40"><Plus size={16} aria-hidden="true" /></button>
                </div>
              </div>
              <div className="flex min-w-[220px] flex-1 gap-3">
                <Button type="button" onClick={() => void addProductToCart()} disabled={!selectedVariant || stock <= 0} className="flex-1 gap-2 bg-teal-700 hover:bg-teal-800">
                  <ShoppingCart size={18} aria-hidden="true" /> Thêm vào giỏ
                </Button>
                <Link href="/cart" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-900 transition hover:border-teal-700 hover:text-teal-700">Xem giỏ</Link>
              </div>
            </div>

            {message ? <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{message}</p> : null}
            {error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p> : null}
          </section>
        </div>

        <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
          {trustItems.map(({ icon: Icon, title, detail }) => (
            <div key={title} className="flex items-center gap-3 bg-white px-4 py-4">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Icon size={19} aria-hidden="true" /></span>
              <div><p className="text-sm font-bold text-slate-900">{title}</p><p className="mt-0.5 text-xs text-slate-500">{detail}</p></div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <SectionCard>
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Khám phá chi tiết</p><h2 className="mt-1 text-2xl font-black">Mô tả sản phẩm</h2></div><Badge tone="success">Đã kiểm duyệt</Badge></div>
              <p className="mt-5 whitespace-pre-line leading-8 text-slate-600">{product.description || "Thông tin mô tả sản phẩm đang được cập nhật. Vui lòng liên hệ NovaTech để được tư vấn chi tiết."}</p>
            </SectionCard>

            <SectionCard>
              <div className="border-b border-slate-200 pb-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Thông tin kỹ thuật</p><h2 className="mt-1 text-2xl font-black">Thông số sản phẩm</h2></div>
              {selectedVariant?.attributes && Object.keys(selectedVariant.attributes).length ? (
                <dl className="mt-5 divide-y divide-slate-100">
                  {Object.entries(selectedVariant.attributes).map(([key, value]) => <div key={key} className="grid gap-1 py-3 sm:grid-cols-[minmax(140px,0.35fr)_1fr]"><dt className="text-sm font-semibold text-slate-500">{formatAttributeKey(key)}</dt><dd className="text-sm font-semibold text-slate-900">{formatAttributeValue(value)}</dd></div>)}
                </dl>
              ) : <EmptyState title="Thông số đang được cập nhật" message="Bạn có thể gửi tin nhắn cho NovaTech để nhận tư vấn về phiên bản này." action={<Link href="/contact" className="font-bold text-teal-700 hover:underline">Liên hệ tư vấn</Link>} />}
            </SectionCard>

            <SectionCard>
              <div id="reviews" className="scroll-mt-24">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Trải nghiệm khách hàng</p><h2 className="mt-1 text-2xl font-black">Đánh giá sản phẩm</h2></div><div className="flex items-center gap-2"><span className="text-3xl font-black">{averageRating > 0 ? averageRating.toFixed(1) : "--"}</span><span className="text-sm text-slate-500">/ 5<br />{reviews.length} lượt đánh giá</span></div></div>
                <div className="mt-5 flex items-center gap-1 text-amber-500" aria-label={`${averageRating.toFixed(1)} trên 5 sao`}>
                  {Array.from({ length: 5 }, (_, index) => <Star key={index} size={18} fill={index < Math.round(averageRating) ? "currentColor" : "none"} aria-hidden="true" />)}
                </div>
                {reviews.length ? <div className="mt-5 space-y-3">{reviews.map((item) => <article key={item.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold text-slate-900">{item.user_name ?? "Khách hàng"}</p><time className="text-xs text-slate-500" dateTime={item.created_at}>{formatReviewDate(item.created_at)}</time></div><div className="mt-2 flex items-center gap-1 text-amber-500">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={14} fill={index < item.rating ? "currentColor" : "none"} aria-hidden="true" />)}</div><p className="mt-2 text-sm leading-6 text-slate-600">{item.content || "Khách hàng chưa để lại nội dung."}</p></article>)}</div> : <p className="mt-5 rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ cảm nhận.</p>}
                <div className="mt-6 border-t border-slate-200 pt-6"><h3 className="font-bold">Chia sẻ trải nghiệm của bạn</h3><div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr] sm:items-start"><Select value={review.rating} onChange={(event) => setReview({ ...review, rating: event.target.value })} aria-label="Số sao đánh giá">{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} sao</option>)}</Select><Textarea value={review.content} onChange={(event) => setReview({ ...review, content: event.target.value })} placeholder="Sản phẩm có phù hợp với nhu cầu của bạn không?" /></div><Button type="button" onClick={() => void submitReview()} className="mt-3">Gửi đánh giá</Button></div>
              </div>
            </SectionCard>
          </div>

          <aside className="space-y-6">
            <SectionCard className="lg:sticky lg:top-24">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Mua sắm an tâm</p>
              <h2 className="mt-2 text-xl font-black">Dịch vụ NovaTech</h2>
              <ul className="mt-5 space-y-4 text-sm text-slate-600">
                <li className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-teal-700" size={18} aria-hidden="true" /><span><strong className="block text-slate-900">Kiểm tra trước khi nhận</strong>Đối chiếu sản phẩm và phụ kiện cùng đơn hàng.</span></li>
                <li className="flex gap-3"><Truck className="mt-0.5 shrink-0 text-teal-700" size={18} aria-hidden="true" /><span><strong className="block text-slate-900">Thanh toán linh hoạt</strong>Hỗ trợ COD và các phương thức thanh toán trực tuyến.</span></li>
                <li className="flex gap-3"><RotateCcw className="mt-0.5 shrink-0 text-teal-700" size={18} aria-hidden="true" /><span><strong className="block text-slate-900">Đổi trả minh bạch</strong>Liên hệ đội ngũ hỗ trợ khi sản phẩm có vấn đề.</span></li>
              </ul>
              <Link href="/contact" className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-900 transition hover:border-teal-700 hover:text-teal-700">Cần tư vấn? Liên hệ ngay</Link>
            </SectionCard>
          </aside>
        </div>

        {product.related_products?.length ? <ProductRail title="Có thể bạn cũng thích" products={product.related_products} /> : null}
        {recentlyViewed.length ? <ProductRail title="Đã xem gần đây" products={recentlyViewed} /> : null}
      </div>
    </main>
  );
}

function ProductRail({ title, products }: { title: string; products: Product[] }) {
  return <section className="mt-12"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Gợi ý cho bạn</p><h2 className="mt-1 text-2xl font-black">{title}</h2></div><Link href="/products" className="text-sm font-bold text-teal-700 hover:underline">Xem tất cả</Link></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{products.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>;
}

function ProductLoading() {
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><div className="mb-6 h-5 w-64"><Skeleton className="h-5" /></div><div className="grid gap-6 xl:grid-cols-2"><Skeleton className="aspect-[4/3] rounded-[28px]" /><Skeleton className="min-h-[520px] rounded-[28px]" /></div></main>;
}

function getDiscountPercent(variant: ProductVariant | null) {
  if (!variant?.sale_price) return 0;
  const price = Number(variant.price);
  const salePrice = Number(variant.sale_price);
  return price > salePrice ? Math.round(((price - salePrice) / price) * 100) : 0;
}

function formatAttributeKey(key: string) {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (character) => character.toUpperCase());
}

function formatAttributeValue(value: unknown): string {
  if (value === null || value === undefined) return "Đang cập nhật";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function formatReviewDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

function updateRecentlyViewed(product: Product, setRecentlyViewed: (products: Product[]) => void) {
  try {
    const stored = JSON.parse(window.localStorage.getItem("recently_viewed_products") ?? "[]") as Product[];
    const next = [product, ...stored.filter((item) => item.id !== product.id)].slice(0, 4);
    window.localStorage.setItem("recently_viewed_products", JSON.stringify(next));
    setRecentlyViewed(next.filter((item) => item.id !== product.id));
  } catch {
    setRecentlyViewed([]);
  }
}
