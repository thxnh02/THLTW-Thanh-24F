"use client";

import { useEffect, useState } from "react";
import brandServices from "@/services/brandServices";

export default function BrandsPage() {
  const [brands, setBrands] = useState([]); const [error, setError] = useState("");
  useEffect(() => { brandServices.getBrands().then((response) => setBrands(response.data.data)).catch(() => setError("Không tải được thương hiệu.")); }, []);
  return <section><h1 className="mb-5 text-2xl font-bold">Thương hiệu</h1>{error && <p className="text-red-600">{error}</p>}<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">{brands.map((brand) => <article className="rounded border bg-white p-4" key={brand.id}><h2 className="font-semibold">{brand.name}</h2><p className="text-sm text-slate-600">{brand.description}</p></article>)}</div></section>;
}
