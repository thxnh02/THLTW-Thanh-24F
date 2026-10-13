"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/common/Pagination";
import productServices from "@/services/productServices";

export default function ProductsPage() {
  const [products, setProducts] = useState([]); const [meta, setMeta] = useState(null); const [page, setPage] = useState(1); const [error, setError] = useState("");
  useEffect(() => { Promise.resolve().then(() => setPage(Number(new URLSearchParams(window.location.search).get("page")) || 1)); }, []);
  useEffect(() => { productServices.getProducts({ page }).then((response) => { setProducts(response.data.data); setMeta(response.data.meta); }).catch(() => setError("Không tải được sản phẩm.")); }, [page]);
  const changePage = (nextPage) => { window.history.pushState({}, "", `/products?page=${nextPage}`); setPage(nextPage); };
  return <section><h1 className="mb-5 text-2xl font-bold">Sản phẩm</h1>{error && <p className="text-red-600">{error}</p>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <article className="rounded border bg-white p-4" key={product.id}><h2 className="font-semibold">{product.name}</h2><p className="text-sm">{product.category?.name} {product.brand ? `• ${product.brand.name}` : ""}</p><p className="mt-2 font-medium">{Number(product.price).toLocaleString("vi-VN")} đ</p></article>)}</div><Pagination meta={meta} onPageChange={changePage} /></section>;
}
