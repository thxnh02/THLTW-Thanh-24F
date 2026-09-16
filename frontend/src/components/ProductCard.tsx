"use client";

import Link from "next/link";
import Image from "next/image";

import { useCart } from "@/contexts/CartContext";
import { effectivePrice, formatVnd } from "@/lib/format";
import type { Product } from "@/types/api";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const hasSale = product.sale_price !== null && product.sale_price !== undefined;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
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
        <div className="min-h-24">
          <p className="text-xs font-semibold uppercase text-teal-700">
            {product.category?.name ?? "San pham"}
          </p>
          <Link href={`/products/${product.slug}`} className="mt-1 block font-semibold text-slate-950">
            {product.name}
          </Link>
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">
            {product.short_description}
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
          </div>
          <button
            type="button"
            onClick={() => addItem(product)}
            disabled={!product.default_variant || product.stock_quantity <= 0}
            className="h-10 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Them
          </button>
        </div>
      </div>
    </article>
  );
}
