"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/shop/ProductCard";
import Pagination from "@/components/common/Pagination";
import productServices from "@/services/productServices";

export default function ProductsClient({ initialPage = 1 }) {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [error, setError] = useState("");

  useEffect(() => {
    productServices.getProducts({ page })
      .then((response) => { setProducts(response.data.data ?? []); setMeta(response.data.meta); setError(""); })
      .catch(() => setError("Không tải được sản phẩm. Hãy kiểm tra Laravel API đang chạy."));
  }, [page]);

  const changePage = (target) => {
    setPage(target);
    router.push(target === 1 ? "/products" : `/products?page=${target}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return <section>
    <div className="mb-9 flex flex-col justify-between gap-5 rounded-[1.75rem] bg-[#eaf1eb] p-8 sm:flex-row sm:items-end sm:p-11"><div><p className="eyebrow">Thiết bị cho nhịp sống hiện đại</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#19352f]">Sản phẩm</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Khám phá những lựa chọn công nghệ thực tế, tinh gọn và hữu ích mỗi ngày.</p></div><div className="rounded-2xl bg-white/75 px-5 py-4"><span className="block text-2xl font-semibold text-[#37665b]">{meta?.total ?? "—"}</span><span className="text-xs text-slate-500">sản phẩm trong cửa hàng</span></div></div>
    {error && <p className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {products.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : !error && <p className="rounded-2xl border border-dashed border-[#d6dfd9] p-12 text-center text-sm text-slate-500">Đang tải sản phẩm...</p>}
    <div className="mt-8"><Pagination meta={meta} onPageChange={changePage} /></div>
  </section>;
}
