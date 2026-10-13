"use client";

import Image from "next/image";
import Link from "next/link";
import { PackageX, ShoppingCart, Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Badge, Button } from "@/components/ui";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";
import { effectivePrice, formatVnd } from "@/lib/format";
import type { Product } from "@/types/api";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const toast = useToast();
  const reducedMotion = useReducedMotion();
  const hasSale = product.sale_price !== null && product.sale_price !== undefined;
  const outOfStock = !product.default_variant || product.stock_quantity <= 0;
  const discount = hasSale && Number(product.price) > 0
    ? Math.round((1 - Number(product.sale_price) / Number(product.price)) * 100)
    : 0;

  function handleAddToCart() {
    addItem(product);
    toast.success("Đã thêm sản phẩm vào giỏ hàng.");
  }

  return (
    <motion.article
      initial={false}
      whileHover={reducedMotion ? undefined : { y: -3 }}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-[var(--shadow-card)] transition hover:border-teal-300 hover:shadow-[var(--shadow-lift)]"
    >
      <Link href={`/products/${product.slug}`} className="relative block overflow-hidden bg-slate-100">
        <Image src={product.primary_image || "/product-placeholder.svg"} alt={product.name} width={640} height={480} unoptimized className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.025]" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {discount > 0 ? <Badge tone="danger">Giảm {discount}%</Badge> : null}
          {outOfStock ? <Badge tone="neutral">Hết hàng</Badge> : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-h-32">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-teal-700">{product.category?.name ?? "Sản phẩm"}</p>
          <Link href={`/products/${product.slug}`} className="mt-1 block line-clamp-2 font-semibold text-slate-950 transition hover:text-teal-800">
            {product.name}
          </Link>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{product.short_description || "Thông tin sản phẩm đang được cập nhật."}</p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="min-w-0">
            <p className="font-bold text-slate-950">{formatVnd(effectivePrice(product.price, product.sale_price))}</p>
            {hasSale ? <p className="mt-0.5 text-xs text-slate-500 line-through">{formatVnd(product.price)}</p> : <p className="mt-0.5 text-xs text-transparent">-</p>}
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              {product.review_count ? <><Star size={13} className="fill-amber-400 text-amber-500" aria-hidden="true" />{Number(product.average_rating || 0).toFixed(1)} · {product.review_count} đánh giá</> : <><PackageX size={13} aria-hidden="true" />Chưa có đánh giá</>}
            </p>
          </div>
          <Button type="button" onClick={handleAddToCart} disabled={outOfStock} className="shrink-0 bg-teal-700 px-3 hover:bg-teal-800" aria-label={`Thêm ${product.name} vào giỏ hàng`} title="Thêm vào giỏ hàng">
            <ShoppingCart size={17} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
