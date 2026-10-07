"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { apiGetList } from "@/lib/api";
import type { Post, PostCategory } from "@/types/api";

export default function PostsPage() { return <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-8"><Skeleton className="h-10 w-48" /><Skeleton className="mt-6 h-72 w-full" /></main>}><PostsContent /></Suspense>; }

function PostsContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "";
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { Promise.all([apiGetList<Post>(`/posts${category ? `?category=${encodeURIComponent(category)}` : ""}`), apiGetList<PostCategory>("/post-categories")]).then(([postData, categoryData]) => { setPosts(postData); setCategories(categoryData); }).catch(() => setError("Không thể tải bài viết. Vui lòng thử lại.")).finally(() => setLoading(false)); }, [category]);

  return <main className="mx-auto max-w-7xl px-4 py-8"><div className="mb-7"><p className="text-sm font-bold uppercase tracking-wider text-teal-700">Góc chia sẻ</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Bài viết</h1><p className="mt-2 text-slate-600">Thông tin hữu ích giúp bạn chọn và sử dụng sản phẩm hiệu quả.</p></div><div className="flex flex-wrap gap-2">{[["Tất cả", ""], ...categories.map((item) => [item.name, item.slug] as const)].map(([label, value]) => <Link key={value || "all"} href={value ? `/posts?category=${value}` : "/posts"} className={`rounded-full border px-3 py-2 text-sm font-semibold ${category === value ? "border-teal-700 bg-teal-50 text-teal-900" : "border-slate-300 text-slate-700 hover:border-teal-700"}`}>{label}</Link>)}</div>{error ? <div className="mt-6"><ErrorState message={error} /></div> : loading ? <div className="mt-6 grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-96" />)}</div> : posts.length === 0 ? <div className="mt-6"><EmptyState title="Chưa có bài viết" message="Nội dung trong danh mục này đang được cập nhật." /></div> : <div className="mt-6 grid gap-4 md:grid-cols-3">{posts.map((post) => <article key={post.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><Link href={`/posts/${post.slug}`} className="group block"><Image src={post.thumbnail || "/product-placeholder.svg"} alt={post.title} width={640} height={360} className="aspect-[16/9] w-full object-cover transition group-hover:scale-[1.02]" /><div className="p-5"><p className="text-xs font-semibold text-teal-700">{post.category?.name || "Kiến thức"}</p><h2 className="mt-2 line-clamp-2 font-bold text-slate-950 group-hover:text-teal-800">{post.title}</h2><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{post.excerpt || "Xem bài viết để biết thêm thông tin hữu ích."}</p>{post.published_at ? <time className="mt-4 block text-xs text-slate-500" dateTime={post.published_at}>{new Intl.DateTimeFormat("vi-VN").format(new Date(post.published_at))}</time> : null}</div></Link></article>)}</div>}</main>;
}
