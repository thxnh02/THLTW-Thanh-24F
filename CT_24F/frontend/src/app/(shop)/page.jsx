"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "@/components/shop/ProductCard";
import PostCard from "@/components/shop/PostCard";
import categoryServices from "@/services/categoryServices";
import productServices from "@/services/productServices";
import postServices from "@/services/postServices";

const categoryIcons = { "dien-thoai": "◉", laptop: "▱", "phu-kien": "⌁", "sac-va-cap": "ϟ" };

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([categoryServices.getCategories(), productServices.getProducts({ page: 1 })])
      .then(([categoryResponse, productResponse]) => {
        setCategories(categoryResponse.data.data ?? []);
        setProducts(productResponse.data.data ?? []);
      })
      .catch(() => setError("Chưa kết nối được cửa hàng. Hãy kiểm tra Laravel API đang chạy."));
  }, []);

  // Bài viết được tải riêng để lỗi phần nội dung không chặn danh mục và sản phẩm.
  useEffect(() => {
    let current = true;
    postServices.getPublishedPosts({ page: 1 }).then(({ data }) => {
      if (current) setPosts((data.data ?? []).slice(0, 3));
    }).catch(() => { if (current) setPosts([]); });
    return () => { current = false; };
  }, []);

  return <div className="space-y-16 pb-12">
    <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#142f2c] px-7 py-14 text-white shadow-xl sm:px-12 sm:py-20">
      <div className="absolute -right-20 -top-24 -z-10 h-80 w-80 rounded-full bg-[#b8e0c7]/20 blur-3xl" />
      <div className="absolute -bottom-40 right-1/3 -z-10 h-72 w-72 rounded-full bg-[#f7a773]/20 blur-3xl" />
      <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[.22em] text-[#c8ebd4]">CT_24F · tuyển chọn mỗi ngày</p>
      <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">Công nghệ tốt.<br /><span className="font-serif italic text-[#b8e0c7]">Cuộc sống nhẹ tênh.</span></h1>
      <p className="mt-6 max-w-lg text-base leading-7 text-white/70">Những thiết bị và phụ kiện hữu ích, được chọn lọc để đồng hành cùng nhịp sống của bạn.</p>
      <div className="mt-9 flex flex-wrap gap-3"><Link className="rounded-full bg-[#d1edda] px-6 py-3 text-sm font-semibold text-[#142f2c] transition hover:bg-white" href="/products">Khám phá sản phẩm <span aria-hidden="true">↗</span></Link><Link className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10" href="/categories">Xem danh mục</Link></div>
      <div className="mt-12 flex items-center gap-3 text-xs text-white/60"><span className="h-px w-10 bg-[#b8e0c7]" /> Thiết kế tinh gọn · Chọn lựa có gu</div>
    </section>

    <section>
      <div className="mb-6 flex items-end justify-between gap-4"><div><p className="eyebrow">Khám phá theo nhu cầu</p><h2 className="section-title">Danh mục nổi bật</h2></div><Link className="text-sm font-semibold text-[#37665b] hover:underline" href="/categories">Tất cả danh mục ↗</Link></div>
      {categories.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{categories.slice(0, 4).map((category, index) => <Link className={`category-tile category-tile-${index} group`} href="/products" key={category.id}><span className="category-icon">{categoryIcons[category.slug] ?? "✳"}</span><span className="mt-8 block text-lg font-semibold">{category.name}</span><span className="mt-1 block text-sm text-slate-500">Khám phá ngay <span className="transition group-hover:translate-x-1">→</span></span></Link>)}</div> : <p className="rounded-2xl border border-dashed border-[#d6dfd9] p-8 text-center text-sm text-slate-500">{error || "Đang tải danh mục..."}</p>}
    </section>

    <section>
      <div className="mb-6 flex items-end justify-between gap-4"><div><p className="eyebrow">Lựa chọn dành cho bạn</p><h2 className="section-title">Sản phẩm được yêu thích</h2></div><Link className="text-sm font-semibold text-[#37665b] hover:underline" href="/products">Xem tất cả ↗</Link></div>
      {products.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="rounded-2xl border border-dashed border-[#d6dfd9] p-8 text-center text-sm text-slate-500">{error || "Đang tải sản phẩm..."}</p>}
    </section>

    {posts.length > 0 && <section>
      <div className="mb-6 flex items-end justify-between gap-4"><div><p className="eyebrow">Góc chia sẻ</p><h2 className="section-title">Bài viết mới</h2></div><Link className="text-sm font-semibold text-[#37665b] hover:underline" href="/posts">Xem tất cả ↗</Link></div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <PostCard key={post.slug} post={post} />)}</div>
    </section>}

    <section className="flex flex-col justify-between gap-6 rounded-[1.75rem] bg-[#eaf1eb] p-8 sm:flex-row sm:items-center sm:p-10"><div><p className="eyebrow">Không gian dành cho quản trị viên</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#142f2c]">Quản lý cửa hàng thật dễ dàng.</h2></div><Link className="w-fit rounded-full bg-[#142f2c] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#28564d]" href="/admin">Mở trang quản trị ↗</Link></section>
  </div>;
}
