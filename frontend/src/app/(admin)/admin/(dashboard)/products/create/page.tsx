"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ProductForm } from "@/components/admin/forms/ProductForm";
import { PageHeader } from "@/components/ui";

export default function CreateProductPage() {
  return <main className="mx-auto max-w-7xl px-4 py-8"><PageHeader eyebrow="Danh mục sản phẩm" title="Tạo sản phẩm" description="Thêm thông tin, giá bán, tồn kho, biến thể và hình ảnh sản phẩm." action={<Link href="/admin/products" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-teal-600 hover:text-teal-800"><ArrowLeft size={17} aria-hidden="true" /> Quay lại danh sách</Link>} /><ProductForm /></main>;
}
