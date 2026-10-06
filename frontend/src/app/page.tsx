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
  const [activeSlide, setActiveSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const slideCount = home?.banners.length ?? 0;

  function loadHome() {
    setError("");
    apiGet<HomePayload>("/homepage")
      .then(setHome)
      .catch((reason: Error) => setError(reason.message));
  }

  useEffect(() => {
    apiGet<HomePayload>("/homepage")
      .then(setHome)
      .catch((reason: Error) => setError(reason.message));
  }, []);

  useEffect(() => {
    if (slideCount < 2 || carouselPaused) return;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slideCount), 5200);
    return () => window.clearInterval(timer);
  }, [carouselPaused, slideCount]);

  if (error) {
    return <main className="mx-auto max-w-7xl px-4 py-10"><ErrorState title="Không thể tải cửa hàng" message="Vui lòng kiểm tra kết nối và thử lại." onRetry={loadHome} /></main>;
  }

  if (!home) {
    return <main className="mx-auto max-w-7xl px-4 py-10"><Skeleton className="aspect-[2.1/1] w-full" /><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-72" />)}</div></main>;
  }

  const storeName = settings.store_name;
  const slides = home.banners.length > 0 ? home.banners : [{ id: 0, title: storeName, image: "/catalog/tech-flatlay.jpg", link: "/products" }];
  const activeIndex = activeSlide % slides.length;
  const activeBanner = slides[activeIndex];
  const slideKickers = ["Thiết bị công nghệ chọn lọc", "Nâng cấp không gian làm việc", "Công nghệ cho mọi hành trình"];
  const slideDescriptions = ["Điện thoại, laptop, tablet và phụ kiện chính hãng cho công việc, học tập và giải trí mỗi ngày.", "Chọn thiết bị phù hợp với nhịp sống của bạn, từ góc làm việc tại nhà đến những chuyến đi xa.", "Khám phá những sản phẩm giúp mỗi ngày của bạn kết nối hơn, nhanh hơn và tiện lợi hơn."];

  return (
    <main className="bg-slate-50">
      <section className="relative isolate min-h-[560px] overflow-hidden bg-slate-950 text-white sm:min-h-[620px]" onMouseEnter={() => setCarouselPaused(true)} onMouseLeave={() => setCarouselPaused(false)} aria-roledescription="carousel" aria-label="Banner sản phẩm công nghệ">
        {slides.map((slide, index) => <Image key={slide.id} src={slide.image} alt={`${storeName} - sản phẩm công nghệ`} fill priority={index === 0} sizes="100vw" className={`-z-20 object-cover transition-opacity duration-700 ${index === activeIndex ? "opacity-100" : "opacity-0"}`} />)}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.78)_42%,rgba(2,6,23,0.26)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(2,6,23,0.72)_0%,transparent_45%)]" />
        <div className="mx-auto flex min-h-[560px] max-w-7xl items-center px-4 py-16 sm:min-h-[620px] sm:py-20">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-teal-200"><span className="size-2 rounded-full bg-teal-300" /> {slideKickers[activeIndex % slideKickers.length]}</p>
            <h1 className="max-w-2xl text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl">{storeName}</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-200 sm:text-lg">{slideDescriptions[activeIndex % slideDescriptions.length]}</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href={activeBanner.link || "/products"}><Button className="bg-teal-500 text-slate-950 hover:bg-teal-300">Khám phá sản phẩm</Button></Link><Link href="/contact"><Button variant="secondary" className="border-white/40 bg-white/10 text-white hover:border-white hover:bg-white hover:text-slate-950">Tư vấn mua hàng</Button></Link></div>
            <div className="mt-12 grid max-w-xl grid-cols-3 gap-4 border-t border-white/20 pt-5 text-sm text-slate-200"><div><p className="font-bold text-white">Chính hãng</p><p className="mt-1 text-xs text-slate-300">Nguồn gốc rõ ràng</p></div><div><p className="font-bold text-white">Giá minh bạch</p><p className="mt-1 text-xs text-slate-300">Dễ chọn, dễ so sánh</p></div><div><p className="font-bold text-white">Hỗ trợ tận tâm</p><p className="mt-1 text-xs text-slate-300">Đồng hành sau mua</p></div></div>
          </div>
        </div>
        {slides.length > 1 ? <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-3"><button type="button" onClick={() => setActiveSlide((activeIndex - 1 + slides.length) % slides.length)} className="grid size-10 place-items-center rounded-full border border-white/30 bg-slate-950/30 text-lg transition hover:bg-white hover:text-slate-950" aria-label="Banner trước">←</button><div className="flex items-center gap-2" aria-label="Chọn banner">{slides.map((slide, index) => <button key={slide.id} type="button" onClick={() => setActiveSlide(index)} className={`h-2 rounded-full transition-all ${index === activeIndex ? "w-8 bg-teal-300" : "w-2 bg-white/50 hover:bg-white"}`} aria-label={`Chuyển đến banner ${index + 1}`} aria-current={index === activeIndex} />)}</div><button type="button" onClick={() => setActiveSlide((activeIndex + 1) % slides.length)} className="grid size-10 place-items-center rounded-full border border-white/30 bg-slate-950/30 text-lg transition hover:bg-white hover:text-slate-950" aria-label="Banner tiếp theo">→</button></div> : null}
        <span className="absolute bottom-8 right-4 text-sm font-bold tracking-widest text-white/70 sm:right-8">{String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
      </section>

      <section className="border-b border-slate-200 bg-white"><div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:grid-cols-3"><TrustItem title="Danh mục đa dạng" text="Từ điện thoại đến laptop và phụ kiện." /><TrustItem title="Tìm đúng thiết bị" text="Thông tin rõ ràng, lựa chọn dễ dàng." /><TrustItem title="Mua sắm yên tâm" text="Theo dõi đơn hàng ngay trong tài khoản." /></div></section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16"><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Khám phá theo nhu cầu</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Chọn nhóm sản phẩm</h2></div><Link href="/products" className="text-sm font-bold text-teal-800 hover:text-teal-950">Xem tất cả</Link></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{home.categories.map((category, index) => <Link key={category.id} href={`/products?category=${category.slug}`} className="group flex min-h-24 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg"><div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">{category.image ? <Image src={category.image} alt="" fill sizes="64px" className="object-cover transition duration-500 group-hover:scale-110" /> : <span className="grid size-full place-items-center text-lg font-black text-teal-700">{String(index + 1).padStart(2, "0")}</span>}</div><span className="font-bold text-slate-900 group-hover:text-teal-800">{category.name}</span></Link>)}</div></section>
      <ProductSection title="Sản phẩm mới" eyebrow="Vừa cập nhật" products={home.new_products} />
      <ProductSection title="Bán chạy" eyebrow="Được quan tâm nhiều" products={home.best_selling_products} />
      <ProductSection title="Nổi bật" eyebrow="Đáng cân nhắc" products={home.featured_products} />
      {home.latest_posts.length > 0 ? <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16"><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Góc chia sẻ</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Mẹo dùng công nghệ</h2></div><Link href="/posts" className="text-sm font-bold text-teal-800 hover:text-teal-950">Xem tất cả</Link></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{home.latest_posts.map((post) => <SectionCard key={post.id} className="overflow-hidden p-0"><Link href={`/posts/${post.slug}`} className="group block"><div className="overflow-hidden">{post.thumbnail ? <Image src={post.thumbnail} alt="" width={640} height={360} className="aspect-video w-full object-cover transition duration-500 group-hover:scale-105" /> : null}</div><div className="p-4"><p className="text-xs font-bold text-teal-700">{post.category?.name || "Kiến thức"}</p><h3 className="mt-2 line-clamp-2 font-bold text-slate-950 group-hover:text-teal-800">{post.title}</h3><p className="mt-2 line-clamp-2 text-sm text-slate-600">{post.excerpt || "Xem bài viết để biết thêm thông tin hữu ích."}</p>{post.published_at ? <time className="mt-3 block text-xs text-slate-500" dateTime={post.published_at}>{new Intl.DateTimeFormat("vi-VN").format(new Date(post.published_at))}</time> : null}</div></Link></SectionCard>)}</div></section> : null}
    </main>
  );
}

function TrustItem({ title, text }: { title: string; text: string }) {
  return <div className="flex gap-3"><span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-teal-50 text-sm font-black text-teal-700">✓</span><div><p className="font-bold text-slate-950">{title}</p><p className="mt-1 text-sm text-slate-600">{text}</p></div></div>;
}

function ProductSection({ title, eyebrow, products }: { title: string; eyebrow: string; products: HomePayload["new_products"] }) {
  if (!products.length) return null;
  return <section className="border-t border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-4 py-12 sm:py-16"><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">{eyebrow}</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h2></div><Link href="/products" className="text-sm font-bold text-teal-800 hover:text-teal-950">Xem thêm</Link></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div></div></section>;
}
