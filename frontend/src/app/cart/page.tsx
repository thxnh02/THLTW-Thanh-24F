"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import { useCart } from "@/contexts/CartContext";
import { formatVnd } from "@/lib/format";
import type { CartQuote } from "@/types/api";

export default function CartPage() {
  const { items, updateQuantity, removeItem, quote } = useCart();
  const [promotionCode, setPromotionCode] = useState("");
  const [cartQuote, setCartQuote] = useState<CartQuote | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    quote(promotionCode)
      .then(setCartQuote)
      .catch((reason: Error) => setError(reason.message));
  }, [items, promotionCode, quote]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Gio hang</h1>
      {items.length === 0 ? (
        <div className="mt-6 rounded-md border border-slate-200 bg-white p-8">
          <p className="text-slate-600">Gio hang dang trong.</p>
          <Link href="/products" className="mt-4 inline-block rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
            Mua sam ngay
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-3">
            {items.map((item) => (
              <article key={item.variantId} className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[96px_1fr_auto]">
                <Image
                  src={item.image || "/product-placeholder.svg"}
                  alt={item.productName}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-md bg-slate-100 object-cover"
                />
                <div>
                  <h2 className="font-semibold text-slate-950">{item.productName}</h2>
                  <p className="text-sm text-slate-600">
                    {item.variantName} - {item.sku}
                  </p>
                  <p className="mt-2 font-semibold">{formatVnd(item.price)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={item.stockQuantity}
                    value={item.quantity}
                    onChange={(event) => updateQuantity(item.variantId, Number(event.target.value))}
                    className="h-10 w-20 rounded-md border border-slate-300 px-2"
                  />
                  <button type="button" onClick={() => removeItem(item.variantId)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                    Xoa
                  </button>
                </div>
              </article>
            ))}
          </section>
          <aside className="h-fit rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Tam tinh</h2>
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Ma giam gia
              <input
                value={promotionCode}
                onChange={(event) => setPromotionCode(event.target.value.toUpperCase())}
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal"
                placeholder="WELCOME10"
              />
            </label>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Tam tinh" value={formatVnd(cartQuote?.subtotal)} />
              <Row label="Giam gia" value={formatVnd(cartQuote?.discount_total)} />
              <Row label="Phi van chuyen" value={formatVnd(cartQuote?.shipping_fee)} />
              <Row label="Tong cong" value={formatVnd(cartQuote?.grand_total)} strong />
            </dl>
            <Link href="/checkout" className="mt-5 block rounded-md bg-teal-700 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-teal-800">
              Thanh toan
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "border-t border-slate-200 pt-3 text-base font-bold" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
