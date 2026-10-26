"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/common/Pagination";
import PostCard from "@/components/shop/PostCard";
import postServices from "@/services/postServices";

export default function ShopPostsPage() {
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    postServices.getPublishedPosts({ page }).then(({ data }) => {
      if (current) { setPosts(data.data ?? []); setMeta(data.meta); setError(""); }
    }).catch(() => {
      if (current) setError("Không thể tải bài viết. Hãy kiểm tra kết nối và thử lại.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [page, retry]);

  const changePage = (target) => {
    setLoading(true);
    setPage(target);
    window.history.replaceState({}, "", target === 1 ? "/posts" : `/posts?page=${target}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return <section className="pb-10">
    <header className="relative mb-9 overflow-hidden rounded-[1.75rem] bg-[#eaf1eb] p-8 sm:p-11"><div aria-hidden="true" className="absolute -right-12 -top-20 size-64 rounded-full bg-[#cbe1ce]/60 blur-3xl" /><div className="relative"><p className="eyebrow">Góc chia sẻ CT_24F</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#19352f]">Bài viết</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Mẹo sử dụng, lựa chọn và chăm sóc thiết bị công nghệ hằng ngày.</p></div></header>
    {error && <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert"><span>{error}</span><button className="font-semibold underline" onClick={() => { setLoading(true); setRetry((value) => value + 1); }} type="button">Thử lại</button></div>}
    {loading ? <p aria-live="polite" className="rounded-2xl border border-dashed border-[#d6dfd9] p-12 text-center text-sm text-slate-500">Đang tải bài viết…</p> : posts.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <PostCard key={post.slug} post={post} />)}</div> : !error && <p className="rounded-2xl border border-dashed border-[#d6dfd9] p-12 text-center text-sm text-slate-500">Chưa có bài viết nào được xuất bản.</p>}
    <div className="mt-8"><Pagination meta={meta} onPageChange={changePage} /></div>
  </section>;
}
