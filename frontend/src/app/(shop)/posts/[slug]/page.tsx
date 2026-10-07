"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ErrorState, Skeleton } from "@/components/ui";
import { apiGet } from "@/lib/api";
import type { Post } from "@/types/api";

export default function PostDetailPage() {
  const params = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { apiGet<Post>(`/posts/${params.slug}`).then(setPost).catch(() => setError("Không thể tải bài viết này.")); }, [params.slug]);

  return <main className="mx-auto max-w-4xl px-4 py-8"><nav className="mb-5 text-sm text-slate-500" aria-label="Đường dẫn"><Link href="/posts" className="hover:text-teal-800">Bài viết</Link><span className="px-2">/</span><span>Chi tiết</span></nav>{error ? <ErrorState title="Không thể tải bài viết" message={error} /> : !post ? <Skeleton className="h-[520px] w-full" /> : <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><Image src={post.thumbnail || "/product-placeholder.svg"} alt={post.title} width={960} height={420} className="aspect-[16/7] w-full object-cover" /><div className="p-6 sm:p-10"><p className="text-sm font-semibold text-teal-700">{post.category?.name || "Kiến thức"}</p><h1 className="mt-2 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">{post.title}</h1>{post.published_at ? <time className="mt-3 block text-sm text-slate-500" dateTime={post.published_at}>{new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" }).format(new Date(post.published_at))}</time> : null}<div className="mt-8 whitespace-pre-line text-base leading-8 text-slate-700">{post.content}</div></div></article>}</main>;
}
