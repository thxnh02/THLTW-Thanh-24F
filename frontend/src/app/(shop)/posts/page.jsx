"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Pagination from "@/components/common/Pagination";
import PostCard from "@/components/shop/PostCard";
import postServices from "@/services/postServices";
import { postsPageFromSearch, postsPageHref } from "@/lib/shopSearch.mjs";

function PostsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const page = postsPageFromSearch(search);
  const rawPage = searchParams.get("page");
  const [result, setResult] = useState({ key: "", posts: [], meta: null, error: "" });
  const [retry, setRetry] = useState(0);
  const requestKey = `${page}:${retry}`;
  const loading = result.key !== requestKey;
  const posts = loading ? [] : result.posts;
  const meta = loading ? null : result.meta;
  const error = loading ? "" : result.error;

  useEffect(() => {
    if (rawPage !== null && (String(page) !== rawPage || page === 1)) {
      router.replace(postsPageHref(page), { scroll: false });
      return undefined;
    }

    const controller = new AbortController();
    postServices.getPublishedPosts({ page }, { signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted) return;
      setResult({ key: requestKey, posts: data.data ?? [], meta: data.meta ?? null, error: "" });
    }).catch((requestError) => {
      if (controller.signal.aborted || requestError.code === "ERR_CANCELED") return;
      setResult({ key: requestKey, posts: [], meta: null, error: "Không thể tải bài viết. Hãy kiểm tra kết nối và thử lại." });
    });

    return () => controller.abort();
  }, [page, rawPage, requestKey, router]);

  const changePage = (target) => {
    router.push(postsPageHref(target));
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  return <section className="space-y-6 pb-8 sm:space-y-7">
    <header className="rounded-2xl border border-[#e1e9e2] bg-[#eaf1eb] px-5 py-5 sm:px-7 sm:py-6">
      <p className="eyebrow">Góc chia sẻ CT_24F</p>
      <h1 className="section-title">Bài viết</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Mẹo sử dụng, lựa chọn và chăm sóc thiết bị công nghệ hằng ngày.</p>
    </header>
    {error && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700" role="alert"><span>{error}</span><button className="min-h-10 rounded-lg px-2 font-semibold underline focus-visible:outline-2" onClick={() => setRetry((value) => value + 1)} type="button">Thử lại</button></div>}
    {loading ? <p aria-live="polite" className="rounded-2xl border border-dashed border-[#d6dfd9] p-10 text-center text-sm text-slate-500">Đang tải bài viết…</p> : posts.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <PostCard key={post.slug} post={post} />)}</div> : !error && <p className="rounded-2xl border border-dashed border-[#d6dfd9] p-10 text-center text-sm text-slate-500">Chưa có bài viết nào được xuất bản.</p>}
    <Pagination meta={meta} onPageChange={changePage} />
  </section>;
}

export default function ShopPostsPage() {
  return <Suspense fallback={<p aria-live="polite" className="rounded-2xl border border-dashed border-[#d6dfd9] p-10 text-center text-sm text-slate-500">Đang tải bài viết…</p>}><PostsContent /></Suspense>;
}
