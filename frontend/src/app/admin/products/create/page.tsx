"use client";
import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
export default function CreateProductPage() { return <main className="mx-auto max-w-7xl px-4 py-8"><div className="mb-6 flex items-center justify-between"><h1 className="text-3xl font-bold text-slate-950">Tao san pham</h1><Link href="/admin/products" className="text-sm font-semibold">Quay lai</Link></div><ProductForm /></main>; }
