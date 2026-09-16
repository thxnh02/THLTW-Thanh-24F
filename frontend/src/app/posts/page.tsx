"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { apiGet } from "@/lib/api";
import type { Post, PostCategory } from "@/types/api";

export default function PostsPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-8">Dang tai bai viet...</main>}>
      <PostsContent />
    </Suspense>
  );
}

function PostsContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? "";
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiGet<{ data: Post[] }>(`/posts${category ? `?category=${encodeURIComponent(category)}` : ""}`),
      apiGet<PostCategory[]>("/post-categories"),
    ])
      .then(([postPayload, categoryPayload]) => {
        setPosts(postPayload.data ?? []);
        setCategories(categoryPayload);
      })
      .catch((reason: Error) => setError(reason.message));
  }, [category]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Bai viet</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/posts" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
          Tat ca
        </Link>
        {categories.map((item) => (
          <Link key={item.id} href={`/posts?category=${item.slug}`} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
            {item.name}
          </Link>
        ))}
      </div>
      {error ? <p className="mt-4 rounded-md bg-white p-4 text-red-600">{error}</p> : null}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {posts.map((post) => (
          <article key={post.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <Image
              src={post.thumbnail || "/product-placeholder.svg"}
              alt={post.title}
              width={640}
              height={360}
              className="mb-4 aspect-[16/9] w-full rounded-md object-cover"
            />
            <Link href={`/posts/${post.slug}`} className="font-bold text-slate-950 hover:text-teal-700">
              {post.title}
            </Link>
            <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
