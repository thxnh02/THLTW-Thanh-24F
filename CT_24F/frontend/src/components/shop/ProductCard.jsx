import { catalogImageUrl } from "@/lib/catalogImage";

export function formatPrice(value) {
  return `${Number(value ?? 0).toLocaleString("vi-VN")} đ`;
}

export default function ProductCard({ product }) {
  const palette = ["from-[#e8efe8] to-[#c6d9cd]", "from-[#f4e9df] to-[#dfc5ad]", "from-[#e5eaf1] to-[#c2cedd]", "from-[#f1ebdb] to-[#daceaa]"];
  const onSale = product.sale_price != null && Number(product.sale_price) < Number(product.price);
  return <article className="product-card group overflow-hidden rounded-[1.4rem] border border-[#e9ede9] bg-white">
    <div className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br ${palette[(product.id ?? 0) % palette.length]}`} style={product.image ? { backgroundImage: `linear-gradient(#182e2a0a,#182e2a0a), url("${catalogImageUrl(product.image)}")`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}>
      {!product.image && <span aria-hidden="true" className="select-none font-serif text-7xl italic text-[#244941]/20">{product.name?.charAt(0) ?? "✳"}</span>}
      <span className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#37665b] backdrop-blur">{product.category?.name ?? "Mới về"}</span>
      {onSale && <span className="absolute right-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">Giảm giá</span>}
      <span aria-hidden="true" className="absolute bottom-3 right-3 grid h-9 w-9 translate-y-2 place-items-center rounded-full bg-white text-[#244941] opacity-0 shadow-sm transition group-hover:translate-y-0 group-hover:opacity-100">↗</span>
    </div>
    <div className="p-4"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">{product.brand?.name ?? "Tuyển chọn CT_24F"}</p><h3 className="mt-2 line-clamp-2 min-h-12 text-[15px] font-semibold leading-6 text-[#1e302b]">{product.name}</h3><div className="mt-3 flex items-center justify-between gap-2"><div><p className={`text-sm font-bold ${onSale ? "text-rose-700" : "text-[#37665b]"}`}>{formatPrice(onSale ? product.sale_price : product.price)}</p>{onSale && <p className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</p>}</div><span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Xem lựa chọn ↗</span></div></div>
  </article>;
}
