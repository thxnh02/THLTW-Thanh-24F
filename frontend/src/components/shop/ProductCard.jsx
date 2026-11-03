"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { catalogImageUrl } from "@/lib/catalogImage";
import { useCart } from "@/contexts/CartContext";

export function formatPrice(value) {
  return `${Number(value ?? 0).toLocaleString("vi-VN")} đ`;
}

export default function ProductCard({ product }) {
  const router = useRouter();
  const { add } = useCart();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const soldOut = product.stock_quantity === 0;
  const addItem = async (buyNow = false) => {
    if (buyNow) { router.push(`/checkout?buy=${product.id}&quantity=1`); return; }
    setBusy(true); setNotice('');
    try {
      await add(product.id, 1);
      setNotice('Đã thêm vào giỏ.');
    }
    catch (error) { setNotice(error.response?.data?.message ?? 'Không thể thêm sản phẩm.'); }
    finally { setBusy(false); }
  };
  const palette = ["from-[#e8efe8] to-[#c6d9cd]", "from-[#f4e9df] to-[#dfc5ad]", "from-[#e5eaf1] to-[#c2cedd]", "from-[#f1ebdb] to-[#daceaa]"];
  const onSale = product.sale_price != null && Number(product.sale_price) >= 0 && Number(product.sale_price) < Number(product.price);
  return <article className="product-card group flex h-full flex-col overflow-hidden rounded-2xl border border-[#e9ede9] bg-white">
    <Link aria-label={`Xem chi tiết sản phẩm ${product.name}`} className="flex flex-1 flex-col rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#37665b]" href={`/products/${encodeURIComponent(product.slug)}`}>
      <div className={`relative flex aspect-square shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br ${palette[(product.id ?? 0) % palette.length]}`} style={product.image ? { backgroundImage: `linear-gradient(#182e2a0a,#182e2a0a), url("${catalogImageUrl(product.image)}")`, backgroundPosition: "center", backgroundSize: "contain", backgroundRepeat: "no-repeat" } : undefined}>
        {!product.image && <span aria-hidden="true" className="select-none font-serif text-6xl italic text-[#244941]/20">{product.name?.charAt(0) ?? "✳"}</span>}
        {product.category?.name && <span className="absolute left-2.5 top-2.5 max-w-[70%] truncate rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-[#37665b] backdrop-blur">{product.category.name}</span>}
        {onSale && <span className="absolute right-2.5 top-2.5 rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-semibold text-white">Khuyến mãi</span>}
        <span aria-hidden="true" className="absolute bottom-2.5 right-2.5 grid size-8 translate-y-1 place-items-center rounded-full bg-white text-[#244941] opacity-0 shadow-sm transition group-hover:translate-y-0 group-hover:opacity-100">↗</span>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <p className="min-h-4 truncate text-[10px] font-medium text-slate-500">{product.brand?.name ?? ""}</p>
        <h3 className="mt-1.5 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-[#1e302b]">{product.name}</h3>
        <div className="mt-auto flex min-h-12 items-end justify-between gap-2 pt-2.5">
          <div><p className={`text-sm font-bold ${onSale ? "text-rose-700" : "text-[#37665b]"}`}>{formatPrice(onSale ? product.sale_price : product.price)}</p>{onSale && <p className="text-[11px] text-slate-400 line-through">{formatPrice(product.price)}</p>}</div>
          <span className="shrink-0 text-[10px] font-medium text-slate-500">Chi tiết ↗</span>
        </div>
      </div>
    </Link>
    <div className="flex gap-2 border-t border-[#edf1ed] p-3"><button aria-label={`Thêm ${product.name} vào giỏ`} className="min-h-10 flex-1 rounded-full border border-[#b7d0bd] px-2 text-xs font-semibold text-[#28584a] hover:bg-[#eef5ef] disabled:opacity-50" disabled={busy || soldOut} onClick={() => addItem(false)} type="button">{soldOut ? 'Hết hàng' : 'Thêm vào giỏ'}</button><button className="min-h-10 rounded-full bg-[#193f36] px-3 text-xs font-semibold text-white hover:bg-[#28564d] disabled:opacity-50" disabled={busy || soldOut} onClick={() => addItem(true)} type="button">Mua ngay</button></div>
    {notice && <p aria-live="polite" className="px-3 pb-3 text-xs text-[#37665b]">{notice}</p>}
  </article>;
}
