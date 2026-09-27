"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button, EmptyState, Input, SectionCard } from "@/components/ui";
import { useCart } from "@/contexts/CartContext";
import { useConfirm } from "@/contexts/ConfirmContext";
import { formatVnd } from "@/lib/format";
import type { CartQuote } from "@/types/api";

export default function CartPage() {
  const { items, updateQuantity, removeItem, quote } = useCart();
  const confirm = useConfirm();
  const [promotionCode, setPromotionCode] = useState("");
  const [cartQuote, setCartQuote] = useState<CartQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!items.length) return;
    quote(promotionCode).then(setCartQuote).catch(() => setError("Không thể cập nhật tạm tính. Vui lòng thử lại.")).finally(() => setLoading(false));
  }, [items, promotionCode, quote]);

  async function deleteItem(variantId: number, productName: string) {
    if (await confirm({ title: "Xóa sản phẩm?", message: `Bạn có chắc muốn xóa ${productName} khỏi giỏ hàng?`, confirmLabel: "Xóa sản phẩm" })) removeItem(variantId);
  }

  return <main className="mx-auto max-w-7xl px-4 py-8"><p className="text-sm font-bold uppercase tracking-wider text-teal-700">Mua sắm</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Giỏ hàng</h1>{!items.length ? <div className="mt-6"><EmptyState title="Giỏ hàng đang trống" message="Thêm sản phẩm bạn yêu thích để tiếp tục mua sắm." action={<Link href="/products"><Button>Mua sắm ngay</Button></Link>} /></div> : <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_360px]"><section className="space-y-3" aria-label="Sản phẩm trong giỏ hàng">{items.map((item) => <SectionCard key={item.variantId} className="grid gap-4 p-4 sm:grid-cols-[96px_1fr_auto]"><Image src={item.image || "/product-placeholder.svg"} alt={item.productName} width={96} height={96} className="size-24 rounded-md bg-slate-100 object-cover" /><div><h2 className="font-semibold text-slate-950">{item.productName}</h2><p className="mt-1 text-sm text-slate-600">{item.variantName} · {item.sku}</p><p className="mt-2 font-semibold">{formatVnd(item.price)}</p><p className="mt-1 text-xs text-slate-500">Còn {item.stockQuantity} sản phẩm</p></div><div className="flex items-center gap-3 sm:flex-col sm:items-end sm:justify-center"><div className="flex items-center rounded-md border border-slate-300"><button type="button" className="size-10 text-lg" onClick={() => updateQuantity(item.variantId, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Giảm số lượng">−</button><span className="w-9 text-center text-sm" aria-live="polite">{item.quantity}</span><button type="button" className="size-10 text-lg" onClick={() => updateQuantity(item.variantId, item.quantity + 1)} disabled={item.quantity >= item.stockQuantity} aria-label="Tăng số lượng">+</button></div><button type="button" onClick={() => void deleteItem(item.variantId, item.productName)} className="text-sm font-semibold text-red-700 hover:text-red-900">Xóa</button></div></SectionCard>)}</section><SectionCard className="h-fit"><h2 className="text-lg font-bold text-slate-950">Tóm tắt đơn hàng</h2><label className="mt-4 block text-sm font-semibold text-slate-700">Mã giảm giá<Input value={promotionCode} onChange={(event) => setPromotionCode(event.target.value.toUpperCase())} className="mt-1" placeholder="Nhập mã giảm giá" /></label>{error ? <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<dl className="mt-5 space-y-3 text-sm"><Row label="Tạm tính" value={formatVnd(cartQuote?.subtotal)} /><Row label="Giảm giá" value={formatVnd(cartQuote?.discount_total)} /><Row label="Phí vận chuyển" value={formatVnd(cartQuote?.shipping_fee)} /><Row label="Tổng cộng" value={loading ? "Đang tính..." : formatVnd(cartQuote?.grand_total)} strong /></dl><Link href="/checkout" className={`mt-6 block rounded-md bg-teal-700 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-teal-800 ${loading ? "pointer-events-none opacity-60" : ""}`}>Tiến hành thanh toán</Link></SectionCard></div>}</main>;
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div className={`flex justify-between gap-4 ${strong ? "border-t border-slate-200 pt-3 text-base font-bold" : ""}`}><dt>{label}</dt><dd>{value}</dd></div>; }
