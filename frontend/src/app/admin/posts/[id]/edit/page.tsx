"use client";
import Link from "next/link"; import { useParams } from "next/navigation"; import { PostForm } from "@/components/admin/PostForm";
export default function Page() { const params = useParams<{ id: string }>(); return <main className="mx-auto max-w-7xl px-4 py-8"><div className="mb-6 flex items-center justify-between"><h1 className="text-3xl font-bold text-slate-950">Sua bai viet</h1><Link href="/admin/posts" className="text-sm font-semibold">Quay lai</Link></div><PostForm id={params.id} /></main>; }
