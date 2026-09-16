"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import { ProductCard } from "@/components/ProductCard";
import { apiGet } from "@/lib/api";
import type { HomePayload } from "@/types/api";

export default function Home() {
  const [home, setHome] = useState<HomePayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<HomePayload>("/homepage")
      .then(setHome)
      .catch((reason: Error) => setError(reason.message));
  }, []);

  if (error) {
    return <StateMessage title="Khong tai duoc du lieu" message={error} />;
  }

  if (!home) {
    return <StateMessage title="Dang tai cua hang" message="Vui long cho trong giay lat." />;
  }

  const banner = home.banners[0];

  return (
    <main>
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase text-teal-700">Ecommerce demo</p>
            <h1 className="max-w-2xl text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
              THLTW Shop
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-600">
              Website ban hang dung Laravel REST API, Next.js, gio hang guest va checkout COD voi du lieu backend that.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Xem san pham
              </Link>
              <Link
                href="/cart"
                className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-950 hover:border-slate-950"
              >
                Gio hang
              </Link>
            </div>
          </div>
          <Image
            src={banner?.image || "/hero-ecommerce.svg"}
            alt={banner?.title || "THLTW Shop"}
            width={1280}
            height={800}
            className="aspect-[16/10] w-full rounded-md border border-slate-200 object-cover"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {home.categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="rounded-md border border-slate-200 bg-white p-4 font-semibold text-slate-900 shadow-sm hover:border-teal-700"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <ProductSection title="San pham moi" products={home.new_products} />
      <ProductSection title="Ban chay" products={home.best_selling_products} />
      <ProductSection title="Noi bat" products={home.featured_products} />

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-950">Bai viet moi</h2>
          <Link href="/posts" className="text-sm font-semibold text-teal-700">
            Xem tat ca
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {home.latest_posts.map((post) => (
            <article key={post.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-slate-950">{post.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ProductSection({ title, products }: { title: string; products: HomePayload["new_products"] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
        <Link href="/products" className="text-sm font-semibold text-teal-700">
          Xem them
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function StateMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16">
      <div className="rounded-md border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
        <p className="mt-2 text-slate-600">{message}</p>
      </div>
    </main>
  );
}
