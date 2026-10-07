"use client";
import Link from "next/link"; import { PostForm } from "@/components/admin/forms/PostForm";
export default function Page() { return <main className="mx-auto max-w-7xl px-4 py-8"><div className="mb-6 flex items-center justify-between"><h1 className="text-3xl font-bold text-slate-950">Tạo bài viết</h1><Link href="/admin/posts" className="text-sm font-semibold">Quay lại</Link></div><PostForm /></main>; }
