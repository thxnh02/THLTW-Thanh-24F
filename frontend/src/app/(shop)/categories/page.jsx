"use client";

import { useEffect, useState } from "react";
import categoryServices from "@/services/categoryServices";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]); const [error, setError] = useState("");
  useEffect(() => { categoryServices.getCategories().then((response) => setCategories(response.data.data)).catch(() => setError("Không tải được danh mục. Kiểm tra Laravel API.")); }, []);
  return <section><h1 className="mb-5 text-2xl font-bold">Danh mục</h1>{error && <p className="text-red-600">{error}</p>}<div className="grid gap-4 md:grid-cols-2">{categories.map((category) => <article className="rounded border bg-white p-4" key={category.id}><h2 className="font-semibold">{category.name}</h2><p className="text-sm text-slate-600">{category.description}</p>{category.children?.length > 0 && <ul className="mt-3 list-inside list-disc text-sm">{category.children.map((child) => <li key={child.id}>{child.name}</li>)}</ul>}</article>)}</div></section>;
}
