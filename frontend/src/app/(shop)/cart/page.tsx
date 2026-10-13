"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
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
  const loading = cartQuote === null && items.length > 0;
  const [error, setError] = useState("");

  useEffect(() => {
    if (!items.length) return;
    quote(promotionCode)
      .then(setCartQuote)
      .catch(() => setError("Không thể cập nhật tạm tính. Vui lòng thử lại."))
  }, [items, promotionCode, quote]);

  async function deleteItem(variantId: number, productName: string) {
    if (await confirm({ title: "Xóa sản phẩm?", message: `Bạn có chắc muốn xóa ${productName} khỏi giỏ hàng?`, confirmLabel: "Xóa sản phẩm" })) removeItem(variantId);
  }

  return <main className="page-shell py-8 sm:py-10"><header className="border-b border-[var(--border)] pb-6"><p className="text-sm font-bold uppercase tracking-[0.1em] text-teal-700">Mua sắm</p><h1 className="mt-1 flex items-center gap-3 text-3xl font-black tracking-normal text-slate-950"><ShoppingBag className="text-teal-700" aria-hidden="true" />Giỏ hàng</h1></header>{!items.length ? <div className="mt-7"><EmptyState title="Giỏ hàng đang trống" message="Thêm sản phẩm bạn yêu thích để tiếp tục mua sắm." action={<Link href="/products"><Button>Mua sắm ngay<ArrowRight size={17} aria-hidden="true" /></Button></Link>} /></div> : <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><section className="space-y-3" aria-label="Sản phẩm trong giỏ hàng">{items.map((item) => <SectionCard key={item.variantId} className="grid gap-4 p-4 sm:grid-cols-[104px_minmax(0,1fr)_auto]"><Image src={item.image || "/product-placeholder.svg"} alt={item.productName} width={104} height={104} unoptimized className="size-[104px] rounded-md bg-slate-100 object-cover" /><div className="min-w-0"><h2 className="truncate font-semibold text-slate-950">{item.productName}</h2><p className="mt-1 text-sm text-slate-600">{item.variantName} · {item.sku}</p><p className="mt-3 font-bold text-slate-950">{formatVnd(item.price)}</p><p className="mt-1 text-xs text-slate-500">Còn {item.stockQuantity} sản phẩm</p></div><div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center"><div className="flex items-center rounded-lg border border-[var(--border)] bg-white"><button type="button" className="inline-flex size-9 items-center justify-center text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300" onClick={() => updateQuantity(item.variantId, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Giảm số lượng" title="Giảm số lượng"><Minus size={16} aria-hidden="true" /></button><span className="w-9 text-center text-sm font-semibold" aria-live="polite">{item.quantity}</span><button type="button" className="inline-flex size-9 items-center justify-center text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300" onClick={() => updateQuantity(item.variantId, item.quantity + 1)} disabled={item.quantity >= item.stockQuantity} aria-label="Tăng số lượng" title="Tăng số lượng"><Plus size={16} aria-hidden="true" /></button></div><button type="button" onClick={() => void deleteItem(item.variantId, item.productName)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-900"><Trash2 size={15} aria-hidden="true" />Xóa</button></div></SectionCard>)}</section><SectionCard className="h-fit lg:sticky lg:top-28"><h2 className="text-lg font-bold text-slate-950">Tóm tắt đơn hàng</h2><label className="mt-5 block text-sm font-semibold text-slate-700">Mã giảm giá<Input value={promotionCode} onChange={(event) => setPromotionCode(event.target.value.toUpperCase())} className="mt-1.5" placeholder="Nhập mã giảm giá" /></label>{error ? <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<dl className="mt-5 space-y-3 text-sm"><Row label="Tạm tính" value={formatVnd(cartQuote?.subtotal)} /><Row label="Giảm giá" value={formatVnd(cartQuote?.discount_total)} /><Row label="Phí vận chuyển" value={formatVnd(cartQuote?.shipping_fee)} /><Row label="Tổng cộng" value={loading ? "Đang tính..." : formatVnd(cartQuote?.grand_total)} strong /></dl><Link href="/checkout" className={`mt-6 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 ${loading ? "pointer-events-none opacity-60" : ""}`}>Tiến hành thanh toán<ArrowRight size={17} aria-hidden="true" /></Link><Link href="/products" className="mt-3 block text-center text-sm font-semibold text-teal-800 hover:underline">Tiếp tục mua sắm</Link></SectionCard></div>}</main>;
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex justify-between gap-4 ${strong ? "border-t border-[var(--border)] pt-3 text-base font-bold text-slate-950" : "text-slate-600"}`}><dt>{label}</dt><dd className="text-right">{value}</dd></div>;
}
