"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiGet } from "@/lib/api";
import type { Post } from "@/types/api";

export default function PostDetailPage() {
  const params = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<Post>(`/posts/${params.slug}`)
      .then(setPost)
      .catch((reason: Error) => setError(reason.message));
  }, [params.slug]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {error ? <p className="rounded-md bg-white p-4 text-red-600">{error}</p> : null}
      {!post && !error ? <p className="rounded-md bg-white p-4">Dang tai bai viet...</p> : null}
      {post ? (
        <article className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <Image src={post.thumbnail || "/product-placeholder.svg"} alt={post.title} width={960} height={420} className="mb-6 aspect-[16/7] w-full rounded-md object-cover" />
          <p className="text-sm font-semibold text-teal-700">{post.category?.name}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{post.title}</h1>
          <div className="mt-6 whitespace-pre-line leading-7 text-slate-700">{post.content}</div>
        </article>
      ) : null}
    </main>
  );
}
