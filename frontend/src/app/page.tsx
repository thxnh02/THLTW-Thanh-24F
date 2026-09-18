"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ProductCard } from "@/components/ProductCard";
import { Button, ErrorState, SectionCard, Skeleton } from "@/components/ui";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";
import { apiGet } from "@/lib/api";
import type { HomePayload } from "@/types/api";

export default function Home() {
  const settings = useStoreSettings();
  const [home, setHome] = useState<HomePayload | null>(null);
  const [error, setError] = useState("");

  const loadHome = () => {
    setError("");
    apiGet<HomePayload>("/homepage").then(setHome).catch((reason: Error) => setError(reason.message));
  };

  useEffect(() => { apiGet<HomePayload>("/homepage").then(setHome).catch((reason: Error) => setError(reason.message)); }, []);

  if (error) return <main className="mx-auto max-w-7xl px-4 py-10"><ErrorState title="Không thể tải cửa hàng" message="Vui lòng kiểm tra kết nối và thử lại." onRetry={loadHome} /></main>;
  if (!home) return <main className="mx-auto max-w-7xl px-4 py-10"><Skeleton className="aspect-[2.1/1] w-full" /><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-72" />)}</div></main>;

  const banner = home.banners[0];
  const storeName = settings.store_name || "Công Nghệ Việt";

  return <main>
    <section className="border-b border-slate-200 bg-white"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-16"><div className="space-y-5"><p className="text-sm font-bold uppercase tracking-wider text-teal-700">Mua sắm thông minh</p><h1 className="max-w-xl text-4xl font-bold text-slate-950 sm:text-5xl">{banner?.title || storeName}</h1><p className="max-w-xl text-lg leading-8 text-slate-600">Khám phá sản phẩm công nghệ chính hãng, giá rõ ràng và dịch vụ hỗ trợ chu đáo.</p><div className="flex flex-wrap gap-3"><Link href={banner?.link || "/products"}><Button>Xem sản phẩm</Button></Link><Link href="/contact"><Button variant="secondary">Tư vấn mua hàng</Button></Link></div></div>{banner ? <Image src={banner.image} alt={banner.title} width={1280} height={800} priority className="aspect-[16/10] w-full rounded-lg object-cover" /> : <div className="flex aspect-[16/10] items-center justify-center rounded-lg bg-slate-100 text-slate-500">Hình ảnh đang được cập nhật</div>}</div></section>
    <section className="mx-auto max-w-7xl px-4 py-10"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-wider text-teal-700">Khám phá</p><h2 className="mt-1 text-2xl font-bold text-slate-950">Danh mục sản phẩm</h2></div><Link href="/products" className="text-sm font-semibold text-teal-800 hover:text-teal-950">Xem tất cả</Link></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{home.categories.map((category) => <Link key={category.id} href={`/products?category=${category.slug}`} className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-teal-300 hover:shadow-md">{category.image ? <Image src={category.image} alt="" width={56} height={56} className="size-14 rounded-md object-cover" /> : <span className="flex size-14 items-center justify-center rounded-md bg-teal-50 text-xl text-teal-800" aria-hidden="true">⌂</span>}<span className="font-semibold text-slate-900 group-hover:text-teal-800">{category.name}</span></Link>)}</div></section>
    <ProductSection title="Sản phẩm mới" products={home.new_products} />
    <ProductSection title="Bán chạy" products={home.best_selling_products} />
    <ProductSection title="Nổi bật" products={home.featured_products} />
    {home.latest_posts.length > 0 ? <section className="mx-auto max-w-7xl px-4 py-10"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-wider text-teal-700">Góc chia sẻ</p><h2 className="mt-1 text-2xl font-bold text-slate-950">Bài viết mới</h2></div><Link href="/posts" className="text-sm font-semibold text-teal-800 hover:text-teal-950">Xem tất cả</Link></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{home.latest_posts.map((post) => <SectionCard key={post.id} className="p-0"><Link href={`/posts/${post.slug}`} className="group block overflow-hidden rounded-lg"><>{post.thumbnail ? <Image src={post.thumbnail} alt="" width={640} height={360} className="aspect-video w-full object-cover transition group-hover:scale-[1.02]" /> : null}</><div className="p-4"><p className="text-xs font-semibold text-teal-700">{post.category?.name || "Kiến thức"}</p><h3 className="mt-2 line-clamp-2 font-semibold text-slate-950 group-hover:text-teal-800">{post.title}</h3><p className="mt-2 line-clamp-2 text-sm text-slate-600">{post.excerpt || "Xem bài viết để biết thêm thông tin hữu ích."}</p>{post.published_at ? <time className="mt-3 block text-xs text-slate-500" dateTime={post.published_at}>{new Intl.DateTimeFormat("vi-VN").format(new Date(post.published_at))}</time> : null}</div></Link></SectionCard>)}</div></section> : null}
  </main>;
}

function ProductSection({ title, products }: { title: string; products: HomePayload["new_products"] }) {
  if (!products.length) return null;
  return <section className="mx-auto max-w-7xl px-4 py-8"><div className="mb-5 flex items-end justify-between gap-4"><h2 className="text-2xl font-bold text-slate-950">{title}</h2><Link href="/products" className="text-sm font-semibold text-teal-800 hover:text-teal-950">Xem thêm</Link></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>;
}
