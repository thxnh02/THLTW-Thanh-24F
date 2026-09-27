"use client";

import Link from "next/link";
import Image from "next/image";

import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";
import { effectivePrice, formatVnd } from "@/lib/format";
import { Badge, Button } from "@/components/ui";
import type { Product } from "@/types/api";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const toast = useToast();
  const hasSale = product.sale_price !== null && product.sale_price !== undefined;
  const outOfStock = !product.default_variant || product.stock_quantity <= 0;
  const discount = hasSale && Number(product.price) > 0
    ? Math.round((1 - Number(product.sale_price) / Number(product.price)) * 100)
    : 0;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="block bg-slate-100">
        <Image
          src={product.primary_image || "/product-placeholder.svg"}
          alt={product.name}
          width={640}
          height={480}
          className="aspect-[4/3] w-full object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex min-h-28 flex-col">
          <div className="flex min-h-6 flex-wrap gap-2">
            {discount > 0 ? <Badge tone="danger">-{discount}%</Badge> : null}
            {outOfStock ? <Badge tone="neutral">Hết hàng</Badge> : null}
          </div>
          <p className="mt-2 text-xs font-semibold uppercase text-teal-700">
            {product.category?.name ?? "Sản phẩm"}
          </p>
          <Link href={`/products/${product.slug}`} className="mt-1 block font-semibold text-slate-950 hover:text-teal-800">
            {product.name}
          </Link>
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">
            {product.short_description || "Thông tin sản phẩm đang được cập nhật."}
          </p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="font-bold text-slate-950">
              {formatVnd(effectivePrice(product.price, product.sale_price))}
            </p>
            {hasSale ? (
              <p className="text-xs text-slate-500 line-through">{formatVnd(product.price)}</p>
            ) : null}
            <p className="mt-1 text-xs text-slate-500">{product.review_count ? `★ ${Number(product.average_rating || 0).toFixed(1)} · ${product.review_count} đánh giá` : "Chưa có đánh giá"}</p>
          </div>
          <Button
            type="button"
            onClick={() => { addItem(product); toast.success("Đã thêm sản phẩm vào giỏ hàng."); }}
            disabled={outOfStock}
            className="shrink-0 bg-teal-700 px-3 hover:bg-teal-800"
          >
            Thêm vào giỏ
          </Button>
        </div>
      </div>
    </article>
  );
}
