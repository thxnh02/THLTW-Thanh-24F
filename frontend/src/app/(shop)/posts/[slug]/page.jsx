"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import postServices from "@/services/postServices";

export default function ShopPostDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let current = true;
    postServices.getPublishedPost(slug).then(({ data }) => {
      if (current) { setPost(data.data); setError(""); }
    }).catch((requestError) => {
      if (current) setError(requestError.response?.status === 404 ? "Không tìm thấy bài viết này." : "Không thể tải bài viết. Vui lòng thử lại.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [slug, retry]);

  return <section className="mx-auto max-w-3xl pb-12">
    <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-[#37665b] hover:underline" href="/posts">← Tất cả bài viết</Link>
    {loading && <p aria-live="polite" className="mt-6 rounded-2xl border border-dashed border-[#d6dfd9] p-10 text-center text-sm text-slate-500">Đang tải bài viết…</p>}
    {error && !loading && <div className="mt-6 rounded-2xl bg-red-50 p-6 text-sm text-red-700" role="alert"><p>{error}</p>{error !== "Không tìm thấy bài viết này." && <button className="mt-3 font-semibold underline" onClick={() => { setLoading(true); setRetry((value) => value + 1); }} type="button">Thử lại</button>}</div>}
    {post && !loading && !error && <article className="mt-6 overflow-hidden rounded-[1.75rem] border border-[#e1e9e2] bg-white shadow-sm"><header className="bg-[#eaf1eb] p-7 sm:p-10"><p className="eyebrow">Góc chia sẻ CT_24F</p><h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-[#19352f] sm:text-4xl">{post.title}</h1><time className="mt-5 block text-sm text-slate-500" dateTime={post.created_at}>Đăng ngày {new Date(post.created_at).toLocaleDateString("vi-VN")}</time></header><div className="whitespace-pre-wrap px-7 py-8 text-base leading-8 text-[#30473f] sm:px-10 sm:py-10">{post.content}</div></article>}
  </section>;
}
