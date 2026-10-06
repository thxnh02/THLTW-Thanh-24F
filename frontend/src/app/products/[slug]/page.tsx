"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";

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
    apiGet<Product>(`/products/${slug}`).then((data) => {
      setProduct(data);
      setSelectedVariantId(data.default_variant?.id ?? data.variants?.[0]?.id ?? null);
      setSelectedImage(data.primary_image ?? data.images?.[0]?.path ?? null);
      updateRecentlyViewed(data, setRecentlyViewed);
    }).catch((reason: Error) => setError(reason.message));
  }, [slug]);

  const selectedVariant = useMemo<ProductVariant | null>(() => product?.variants?.find((variant) => variant.id === selectedVariantId) ?? product?.default_variant ?? null, [product, selectedVariantId]);

  async function addWishlist() {
    if (!product) return;
    try {
      await apiPost("/wishlist", { product_id: product.id });
      setMessage("ÄÃ£ thÃªm vÃ o danh sÃ¡ch yÃªu thÃ­ch.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ thÃªm vÃ o danh sÃ¡ch yÃªu thÃ­ch.");
    }
  }

  function addProductToCart() {
    if (!product || !selectedVariant || selectedVariant.stock_quantity <= 0) return;
    addItem(product, selectedVariant, quantity);
    setMessage("ÄÃ£ thÃªm sáº£n pháº©m vÃ o giá» hÃ ng.");
  }

  async function submitReview() {
    if (!product) return;
    try {
      await apiPost(`/products/${product.id}/reviews`, { rating: Number(review.rating), content: review.content || undefined });
      setProduct(await apiGet<Product>(`/products/${slug}`));
      setReview({ rating: "5", content: "" });
      setMessage("ÄÃ£ gá»­i Ä‘Ã¡nh giÃ¡.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "KhÃ´ng thá»ƒ gá»­i Ä‘Ã¡nh giÃ¡.");
    }
  }

  if (error) return <Panel><ErrorState title="KhÃ´ng thá»ƒ táº£i sáº£n pháº©m" message="Sáº£n pháº©m khÃ´ng tá»“n táº¡i hoáº·c Ä‘ang gáº·p lá»—i. Vui lÃ²ng thá»­ láº¡i sau." /></Panel>;
  if (!product) return <Panel><Skeleton className="h-[420px] w-full" /></Panel>;

  const productImages = product.images?.length ? product.images : [{ id: 0, path: product.primary_image || "/product-placeholder.svg" }];

  return <main className="mx-auto max-w-7xl px-4 py-8"><div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]"><div><Image src={selectedImage || product.primary_image || "/product-placeholder.svg"} alt={product.name} width={960} height={720} className="aspect-[4/3] w-full rounded-2xl border border-slate-200 bg-slate-100 object-cover" /><div className="mt-3 flex gap-2 overflow-x-auto">{productImages.map((image) => <button key={image.id} type="button" onClick={() => setSelectedImage(image.path)} className={`shrink-0 rounded-xl border-2 p-0.5 ${selectedImage === image.path ? "border-teal-700" : "border-transparent"}`} aria-label={`Xem áº£nh ${image.id}`}><Image src={image.path} alt="" width={72} height={54} className="size-16 rounded-lg object-cover" /></button>)}</div></div><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-teal-700">{product.category?.name}{product.brand ? ` Â· ${product.brand.name}` : ""}</p><h1 className="mt-2 text-3xl font-bold text-slate-950">{product.name}</h1><p className="mt-3 text-slate-600">{product.short_description || "ThÃ´ng tin sáº£n pháº©m Ä‘ang Ä‘Æ°á»£c cáº­p nháº­t."}</p><div className="mt-5 flex items-end gap-3"><p className="text-3xl font-bold text-slate-950">{formatVnd(selectedVariant?.sale_price ?? selectedVariant?.price)}</p>{selectedVariant?.sale_price ? <p className="pb-1 text-sm text-slate-500 line-through">{formatVnd(selectedVariant.price)}</p> : null}</div><p className="mt-2 text-sm text-slate-600">SKU: <span className="font-semibold">{selectedVariant?.sku}</span> Â· Tá»“n kho: <span className="font-semibold">{selectedVariant?.stock_quantity ?? 0}</span></p><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">PhiÃªn báº£n<Select value={selectedVariantId ?? ""} onChange={(event) => setSelectedVariantId(Number(event.target.value))} className="mt-1 font-normal">{product.variants?.map((variant) => <option key={variant.id} value={variant.id}>{variant.name} - {variant.sku}</option>)}</Select></label><label className="block text-sm font-semibold text-slate-700">Sá»‘ lÆ°á»£ng<Input type="number" min={1} max={selectedVariant?.stock_quantity ?? 1} value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} className="mt-1 font-normal" /></label></div><div className="mt-6 flex flex-wrap gap-3"><Button type="button" onClick={addProductToCart} disabled={!selectedVariant || selectedVariant.stock_quantity <= 0} className="bg-teal-700 hover:bg-teal-800">ThÃªm vÃ o giá»</Button><Link href="/cart" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-950">Xem giá» hÃ ng</Link><Button type="button" variant="secondary" onClick={addWishlist}><Heart size={16} aria-hidden="true" /> <span>Yêu thích</span></Button></div>{message ? <p className="mt-3 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">{message}</p> : null}<div className="mt-8 border-t border-slate-200 pt-6"><h2 className="font-bold text-slate-950">MÃ´ táº£</h2><p className="mt-2 whitespace-pre-line leading-7 text-slate-600">{product.description || "MÃ´ táº£ sáº£n pháº©m Ä‘ang Ä‘Æ°á»£c cáº­p nháº­t."}</p></div><div className="mt-8 border-t border-slate-200 pt-6"><h2 className="font-bold text-slate-950">ÄÃ¡nh giÃ¡ ({product.review_count ?? 0})</h2><p className="mt-1 text-sm text-slate-600">Äiá»ƒm trung bÃ¬nh: <Badge tone="brand">â˜… {Number(product.average_rating ?? 0).toFixed(1)}/5</Badge></p><div className="mt-4 grid gap-3">{product.reviews?.map((item) => <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm"><p className="font-semibold">{item.user_name ?? "ThÃ nh viÃªn"} Â· â˜… {item.rating}/5</p><p className="mt-1 text-slate-600">{item.content}</p></div>)}</div><div className="mt-4 grid gap-3 sm:grid-cols-[120px_1fr_auto]"><Select value={review.rating} onChange={(event) => setReview({ ...review, rating: event.target.value })} className="h-10">{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} sao</option>)}</Select><Input value={review.content} onChange={(event) => setReview({ ...review, content: event.target.value })} placeholder="Ná»™i dung Ä‘Ã¡nh giÃ¡" className="h-10" /><Button type="button" onClick={submitReview} className="min-h-10 px-4">Gá»­i</Button></div></div></section></div><section className="mt-10"><h2 className="mb-4 text-2xl font-bold text-slate-950">Sáº£n pháº©m liÃªn quan</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{product.related_products?.map((related) => <ProductCard key={related.id} product={related} />)}</div></section><section className="mt-10"><h2 className="mb-4 text-2xl font-bold text-slate-950">Sáº£n pháº©m Ä‘Ã£ xem gáº§n Ä‘Ã¢y</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{recentlyViewed.map((item) => <ProductCard key={item.id} product={item} />)}</div></section></main>;
}

function Panel({ children }: { children: React.ReactNode }) { return <main className="mx-auto max-w-7xl px-4 py-12 text-slate-700">{children}</main>; }

function updateRecentlyViewed(product: Product, setRecentlyViewed: (products: Product[]) => void) {
  if (typeof window === "undefined") return;
  const key = "thltw_recently_viewed";
  const current = JSON.parse(window.localStorage.getItem(key) ?? "[]") as Product[];
  const next = [product, ...current.filter((item) => item.id !== product.id)].slice(0, 8);
  window.localStorage.setItem(key, JSON.stringify(next));
  setRecentlyViewed(next.filter((item) => item.id !== product.id));
}
