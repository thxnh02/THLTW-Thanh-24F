"use client";

import Link from "next/link";
import Image from "next/image";
import { use, useEffect, useMemo, useState } from "react";

import { ProductCard } from "@/components/ProductCard";
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

  useEffect(() => {
    apiGet<Product>(`/products/${slug}`)
      .then((data) => {
        setProduct(data);
        setSelectedVariantId(data.default_variant?.id ?? data.variants?.[0]?.id ?? null);
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
      setMessage("Da them vao wishlist.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Vui long dang nhap de them wishlist.");
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
      setMessage("Da gui danh gia.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Khong the gui danh gia.");
    }
  }

  if (error) {
    return <Panel>{error}</Panel>;
  }

  if (!product) {
    return <Panel>Dang tai chi tiet san pham...</Panel>;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
          <Image
            src={product.primary_image || "/product-placeholder.svg"}
            alt={product.name}
            width={960}
            height={720}
            className="aspect-[4/3] w-full rounded-md bg-slate-100 object-cover"
          />
        </div>
        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-teal-700">
            {product.category?.name} {product.brand ? `- ${product.brand.name}` : ""}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{product.name}</h1>
          <p className="mt-3 text-slate-600">{product.short_description}</p>
          <div className="mt-5 flex items-end gap-3">
            <p className="text-3xl font-bold text-slate-950">
              {formatVnd(selectedVariant?.sale_price ?? selectedVariant?.price)}
            </p>
            {selectedVariant?.sale_price ? (
              <p className="pb-1 text-sm text-slate-500 line-through">{formatVnd(selectedVariant.price)}</p>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            SKU: <span className="font-semibold">{selectedVariant?.sku}</span> - Ton kho:{" "}
            <span className="font-semibold">{selectedVariant?.stock_quantity ?? 0}</span>
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Phien ban
              <select
                value={selectedVariantId ?? ""}
                onChange={(event) => setSelectedVariantId(Number(event.target.value))}
                className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950"
              >
                {product.variants?.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} - {variant.sku}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              So luong
              <input
                type="number"
                min={1}
                max={selectedVariant?.stock_quantity ?? 1}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
                className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => addItem(product, selectedVariant, quantity)}
              disabled={!selectedVariant || selectedVariant.stock_quantity <= 0}
              className="rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:bg-slate-300"
            >
              Them vao gio
            </button>
            <Link href="/cart" className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-950">
              Xem gio hang
            </Link>
            <button type="button" onClick={addWishlist} className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-950">
              Them wishlist
            </button>
          </div>
          {message ? <p className="mt-3 rounded-md bg-slate-100 p-3 text-sm text-slate-700">{message}</p> : null}

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="font-bold text-slate-950">Mo ta</h2>
            <p className="mt-2 leading-7 text-slate-600">{product.description}</p>
          </div>
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="font-bold text-slate-950">Danh gia ({product.review_count ?? 0})</h2>
            <p className="mt-1 text-sm text-slate-600">Diem trung binh: {product.average_rating ?? 0}/5</p>
            <div className="mt-4 grid gap-3">
              {product.reviews?.map((item) => (
                <div key={item.id} className="rounded-md bg-slate-50 p-3 text-sm">
                  <p className="font-semibold">{item.user_name ?? "Thanh vien"} - {item.rating}/5</p>
                  <p className="mt-1 text-slate-600">{item.content}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[120px_1fr_auto]">
              <select value={review.rating} onChange={(event) => setReview({ ...review, rating: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3">
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} sao</option>)}
              </select>
              <input value={review.content} onChange={(event) => setReview({ ...review, content: event.target.value })} placeholder="Noi dung danh gia" className="h-10 rounded-md border border-slate-300 px-3" />
              <button type="button" onClick={submitReview} className="rounded-md bg-slate-950 px-4 text-sm font-semibold text-white">Gui</button>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold text-slate-950">San pham lien quan</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {product.related_products?.map((related) => <ProductCard key={related.id} product={related} />)}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold text-slate-950">San pham da xem gan day</h2>
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
