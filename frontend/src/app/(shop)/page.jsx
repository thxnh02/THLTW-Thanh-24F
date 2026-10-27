"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import PostCard from "@/components/shop/PostCard";
import categoryServices from "@/services/categoryServices";
import productServices from "@/services/productServices";
import postServices from "@/services/postServices";

const categoryIcons = { "dien-thoai": "◉", laptop: "▱", "phu-kien": "⌁", "sac-va-cap": "ϟ" };
const initialData = { categories: [], newest: [], sale: [], featured: [], posts: [] };
const initialLoading = { categories: true, newest: true, sale: true, featured: true, posts: true };
const initialErrors = { categories: false, newest: false, sale: false, featured: false, posts: false };

function ProductSection({ eyebrow, title, href, linkLabel, products, loading, error, emptyMessage, onRetry }) {
  return <section aria-label={title}>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">{eyebrow}</p><h2 className="section-title">{title}</h2></div><Link className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#37665b] hover:underline" href={href}>{linkLabel}<ArrowUpRight aria-hidden="true" size={16} /></Link></div>
    {loading && <div aria-label={`Đang tải ${title.toLocaleLowerCase("vi-VN")}`} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="status">{Array.from({ length: 4 }, (_, index) => <div aria-hidden="true" className="h-60 animate-pulse rounded-2xl bg-[#eaf1eb]" key={index} />)}</div>}
    {!loading && error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert"><p>Không tải được mục này. Các phần khác của cửa hàng vẫn hoạt động.</p><button className="mt-3 min-h-10 font-semibold underline" onClick={onRetry} type="button">Thử tải lại</button></div>}
    {!loading && !error && products.length > 0 && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
    {!loading && !error && products.length === 0 && <p className="rounded-2xl border border-dashed border-[#d6dfd9] bg-white/70 p-7 text-center text-sm text-slate-500">{emptyMessage}</p>}
  </section>;
}

export default function HomePage() {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(initialLoading);
  const [errors, setErrors] = useState(initialErrors);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    const requests = [
      ["categories", categoryServices.getCategories()],
      ["newest", productServices.getProducts({ sort: "newest", per_page: 4 })],
      ["sale", productServices.getProducts({ sale: 1, sort: "price_asc", per_page: 4 })],
      ["featured", productServices.getProducts({ featured: 1, sort: "newest", per_page: 4 })],
      ["posts", postServices.getPublishedPosts({ page: 1, per_page: 3 })],
    ];

    Promise.allSettled(requests.map(([, request]) => request)).then((results) => {
      if (!active) return;
      const nextData = {};
      const nextErrors = {};
      results.forEach((result, index) => {
        const key = requests[index][0];
        nextErrors[key] = result.status === "rejected";
        const collection = result.status === "fulfilled" ? (result.value.data?.data ?? []) : [];
        nextData[key] = Array.isArray(collection) ? collection : [];
      });
      setData(nextData);
      setErrors(nextErrors);
      setLoading({ categories: false, newest: false, sale: false, featured: false, posts: false });
    });

    return () => { active = false; };
  }, [retry]);

  const retrySection = () => setRetry((value) => value + 1);

  return <div className="space-y-9 pb-10">
    <section className="relative isolate flex min-h-[260px] flex-col justify-center overflow-hidden rounded-[1.6rem] bg-[#142f2c] px-6 py-8 text-white shadow-lg sm:min-h-[290px] sm:px-10 sm:py-10">
      <div aria-hidden="true" className="absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-[#b8e0c7]/15 blur-3xl" />
      <div className="absolute inset-y-0 right-0 -z-10 hidden w-[42%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#b8e0c7]/10 via-transparent to-transparent lg:block" />
      <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[#c8ebd4]"><Sparkles aria-hidden="true" size={13} /> Công nghệ chọn lọc</p>
      <h1 className="max-w-2xl text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">Thiết bị đúng nhu cầu.<br /><span className="font-serif italic text-[#b8e0c7]">Trải nghiệm nhẹ nhàng.</span></h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-white/75">Khám phá điện thoại, máy tính và phụ kiện từ danh mục sản phẩm.</p>
      <div className="mt-5 flex flex-wrap items-center gap-3"><Link className="inline-flex min-h-11 items-center rounded-full bg-[#d1edda] px-5 text-sm font-semibold text-[#142f2c] transition hover:bg-white" href="/products">Khám phá sản phẩm</Link><Link className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-white/90 hover:underline" href="/categories">Xem danh mục</Link></div>
    </section>

    <section aria-labelledby="home-categories-heading">
      <div className="mb-6 flex items-end justify-between gap-4"><div><p className="eyebrow">Khám phá theo nhu cầu</p><h2 className="section-title" id="home-categories-heading">Danh mục sản phẩm</h2></div><Link className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#37665b] hover:underline" href="/categories">Tất cả danh mục<ArrowUpRight aria-hidden="true" size={16} /></Link></div>
      {loading.categories && <div aria-label="Đang tải danh mục" className="grid grid-cols-2 gap-3 md:grid-cols-4" role="status">{Array.from({ length: 4 }, (_, index) => <div aria-hidden="true" className="h-36 animate-pulse rounded-2xl bg-[#eaf1eb]" key={index} />)}</div>}
      {!loading.categories && errors.categories && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert"><p>Không tải được danh mục.</p><button className="mt-3 min-h-10 font-semibold underline" onClick={retrySection} type="button">Thử tải lại</button></div>}
      {!loading.categories && !errors.categories && data.categories.length > 0 && <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{data.categories.filter((category) => !category.parent_id).slice(0, 4).map((category, index) => <Link className={`category-tile category-tile-${index} group`} href={`/products?category_id=${encodeURIComponent(category.id)}`} key={category.id}><span aria-hidden="true" className="category-icon">{categoryIcons[category.slug] ?? "✳"}</span><span className="mt-4 block text-base font-semibold">{category.name}</span><span className="mt-1 block text-sm text-slate-500">Xem sản phẩm <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span></span></Link>)}</div>}
      {!loading.categories && !errors.categories && data.categories.length === 0 && <p className="rounded-2xl border border-dashed border-[#d6dfd9] p-7 text-center text-sm text-slate-500">Chưa có danh mục đang hiển thị.</p>}
    </section>

    <ProductSection eyebrow="Cập nhật từ danh mục đang hiển thị" title="Sản phẩm mới nhất" href="/products?sort=newest" linkLabel="Xem tất cả" products={data.newest} loading={loading.newest} error={errors.newest} emptyMessage="Chưa có sản phẩm đang hiển thị." onRetry={retrySection} />
    <ProductSection eyebrow="Chỉ sản phẩm có giá ưu đãi hợp lệ" title="Đang khuyến mãi" href="/products?sale=1" linkLabel="Xem ưu đãi" products={data.sale} loading={loading.sale} error={errors.sale} emptyMessage="Hiện chưa có sản phẩm có giá khuyến mãi thấp hơn giá gốc." onRetry={retrySection} />
    <ProductSection eyebrow="Được quản trị viên lựa chọn" title="Sản phẩm nổi bật" href="/products?featured=1" linkLabel="Xem sản phẩm nổi bật" products={data.featured} loading={loading.featured} error={errors.featured} emptyMessage="Chưa có sản phẩm được quản trị viên chọn nổi bật." onRetry={retrySection} />

    <section aria-labelledby="home-posts-heading">
      <div className="mb-6 flex items-end justify-between gap-4"><div><p className="eyebrow">Nội dung đã xuất bản</p><h2 className="section-title" id="home-posts-heading">Bài viết mới</h2></div><Link className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#37665b] hover:underline" href="/posts">Tất cả bài viết<ArrowUpRight aria-hidden="true" size={16} /></Link></div>
      {loading.posts && <div aria-label="Đang tải bài viết" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" role="status">{Array.from({ length: 3 }, (_, index) => <div aria-hidden="true" className="h-56 animate-pulse rounded-2xl bg-[#eaf1eb]" key={index} />)}</div>}
      {!loading.posts && errors.posts && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert"><p>Không tải được bài viết.</p><button className="mt-3 min-h-10 font-semibold underline" onClick={retrySection} type="button">Thử tải lại</button></div>}
      {!loading.posts && !errors.posts && data.posts.length > 0 && <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{data.posts.map((post) => <PostCard key={post.slug} post={post} />)}</div>}
      {!loading.posts && !errors.posts && data.posts.length === 0 && <p className="rounded-2xl border border-dashed border-[#d6dfd9] p-7 text-center text-sm text-slate-500">Chưa có bài viết được xuất bản.</p>}
    </section>

  </div>;
}
