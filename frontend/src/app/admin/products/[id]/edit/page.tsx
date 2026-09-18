"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
export default function EditProductPage() { const params = useParams<{ id: string }>(); return <main className="mx-auto max-w-7xl px-4 py-8"><div className="mb-6 flex items-center justify-between"><h1 className="text-3xl font-bold text-slate-950">Sua san pham</h1><Link href={`/admin/products/${params.id}`} className="text-sm font-semibold">Chi tiet</Link></div><ProductForm id={params.id} /></main>; }
