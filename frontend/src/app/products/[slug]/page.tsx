"use client";

import Link from "next/link";
import Image from "next/image";
import { use, useEffect, useMemo, useState } from "react";

import { ProductCard } from "@/components/ProductCard";
import { Badge, Button, ErrorState, Input, Select, Skeleton } from "@/components/ui";
import { useCart } from "@/contexts/CartContext";
import { apiGet, apiPost } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { Product, ProductVariant } from "@/types/api";

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [review, setReview] = useState({ rating: "5", content: "" });
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Product>(`/products/${slug}`)
      .then((data) => {
        setProduct(data);
        setSelectedVariantId(data.default_variant?.id ?? data.variants?.[0]?.id ?? null);
        setSelectedImage(data.primary_image ?? data.images?.[0]?.path ?? null);
        updateRecentlyViewed(data, setRecentlyViewed);
      })
      .catch((reason: Error) => setError(reason.message));
  }, [slug]);

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!product) {
      return null;
    }
    return product.variants?.find((variant) => variant.id === selectedVariantId) ?? product.default_variant ?? null;
  }, [product, selectedVariantId]);

  async function addWishlist() {
    if (!product) {
      return;
    }
    try {
      await apiPost("/wishlist", { product_id: product.id });
      setMessage("Đã thêm vào danh sách yêu thích.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Vui lòng đăng nhập để thêm vào danh sách yêu thích.");
    }
  }

  async function submitReview() {
    if (!product) {
      return;
    }
    try {
      await apiPost(`/products/${product.id}/reviews`, {
        rating: Number(review.rating),
        content: review.content || undefined,
      });
      const refreshed = await apiGet<Product>(`/products/${slug}`);
      setProduct(refreshed);
      setReview({ rating: "5", content: "" });
      setMessage("Đã gửi đánh giá.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Không thể gửi đánh giá.");
    }
  }

  if (error) {
    return <Panel><ErrorState title="Không thể tải sản phẩm" message="Sản phẩm không tồn tại hoặc đang gặp lỗi. Vui lòng thử lại sau." /></Panel>;
  }

  if (!product) {
    return <Panel><Skeleton className="h-[420px] w-full" /></Panel>;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Image
            src={selectedImage || product.primary_image || "/product-placeholder.svg"}
            alt={product.name}
            width={960}
            height={720}
            className="aspect-[4/3] w-full rounded-lg border border-slate-200 bg-slate-100 object-cover"
          />
          <div className="mt-3 flex gap-2 overflow-x-auto">{(product.images?.length ? product.images : [{ id: 0, path: product.primary_image || "/product-placeholder.svg" }]).map((image) => <button key={image.id} type="button" onClick={() => setSelectedImage(image.path)} className={`shrink-0 rounded-md border-2 p-0.5 ${selectedImage === image.path ? "border-teal-700" : "border-transparent"}`} aria-label={`Xem ảnh ${image.id}`}><Image src={image.path} alt="" width={72} height={54} className="size-16 rounded object-cover" /></button>)}</div>
        </div>
        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-teal-700">
            {product.category?.name} {product.brand ? ` · ${product.brand.name}` : ""}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{product.name}</h1>
          <p className="mt-3 text-slate-600">{product.short_description || "Thông tin sản phẩm đang được cập nhật."}</p>
          <div className="mt-5 flex items-end gap-3">
            <p className="text-3xl font-bold text-slate-950">
              {formatVnd(selectedVariant?.sale_price ?? selectedVariant?.price)}
            </p>
            {selectedVariant?.sale_price ? (
              <p className="pb-1 text-sm text-slate-500 line-through">{formatVnd(selectedVariant.price)}</p>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            SKU: <span className="font-semibold">{selectedVariant?.sku}</span> · Tồn kho:{" "}
            <span className="font-semibold">{selectedVariant?.stock_quantity ?? 0}</span>
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Phiên bản
              <Select
                value={selectedVariantId ?? ""}
                onChange={(event) => setSelectedVariantId(Number(event.target.value))}
                className="mt-1 font-normal"
              >
                {product.variants?.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} - {variant.sku}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Số lượng
              <Input
                type="number"
                min={1}
                max={selectedVariant?.stock_quantity ?? 1}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
                className="mt-1 font-normal"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => addItem(product, selectedVariant, quantity)}
              disabled={!selectedVariant || selectedVariant.stock_quantity <= 0}
              className="bg-teal-700 hover:bg-teal-800"
            >
              Thêm vào giỏ
            </Button>
            <Link href="/cart" className="inline-flex min-h-11 items-center rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-950">
              Xem giỏ hàng
            </Link>
            <Button type="button" variant="secondary" onClick={addWishlist}>♡ Yêu thích</Button>
          </div>
          {message ? <p className="mt-3 rounded-md bg-slate-100 p-3 text-sm text-slate-700">{message}</p> : null}

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="font-bold text-slate-950">Mô tả</h2>
            <p className="mt-2 whitespace-pre-line leading-7 text-slate-600">{product.description || "Mô tả sản phẩm đang được cập nhật."}</p>
          </div>
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="font-bold text-slate-950">Đánh giá ({product.review_count ?? 0})</h2>
            <p className="mt-1 text-sm text-slate-600">Điểm trung bình: <Badge tone="brand">★ {Number(product.average_rating ?? 0).toFixed(1)}/5</Badge></p>
            <div className="mt-4 grid gap-3">
              {product.reviews?.map((item) => (
                <div key={item.id} className="rounded-md bg-slate-50 p-3 text-sm">
                  <p className="font-semibold">{item.user_name ?? "Thành viên"} · ★ {item.rating}/5</p>
                  <p className="mt-1 text-slate-600">{item.content}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[120px_1fr_auto]">
              <Select value={review.rating} onChange={(event) => setReview({ ...review, rating: event.target.value })} className="h-10">
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} sao</option>)}
              </Select>
              <Input value={review.content} onChange={(event) => setReview({ ...review, content: event.target.value })} placeholder="Nội dung đánh giá" className="h-10" />
              <Button type="button" onClick={submitReview} className="min-h-10 px-4">Gửi</Button>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold text-slate-950">Sản phẩm liên quan</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {product.related_products?.map((related) => <ProductCard key={related.id} product={related} />)}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold text-slate-950">Sản phẩm đã xem gần đây</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recentlyViewed.map((item) => <ProductCard key={item.id} product={item} />)}
        </div>
      </section>
    </main>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-7xl px-4 py-12 text-slate-700">{children}</main>;
}

function updateRecentlyViewed(product: Product, setRecentlyViewed: (products: Product[]) => void) {
  if (typeof window === "undefined") {
    return;
  }

  const key = "thltw_recently_viewed";
  const current = JSON.parse(window.localStorage.getItem(key) ?? "[]") as Product[];
  const next = [product, ...current.filter((item) => item.id !== product.id)].slice(0, 8);
  window.localStorage.setItem(key, JSON.stringify(next));
  setRecentlyViewed(next.filter((item) => item.id !== product.id));
}
