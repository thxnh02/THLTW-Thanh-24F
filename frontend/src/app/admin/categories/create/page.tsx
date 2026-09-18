"use client";
import Link from "next/link";
import { CategoryForm } from "@/components/admin/CategoryForm";
export default function CreateCategoryPage() { return <main className="mx-auto max-w-7xl px-4 py-8"><div className="mb-6 flex items-center justify-between"><h1 className="text-3xl font-bold text-slate-950">Tao danh muc</h1><Link href="/admin/categories" className="text-sm font-semibold text-slate-700">Quay lai</Link></div><CategoryForm /></main>; }
