"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ProductCard } from "@/components/ProductCard";
import { ApiError, apiDelete, apiGet } from "@/lib/api";
import type { WishlistItem } from "@/types/api";
import { Button, EmptyState } from "@/components/ui";

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    apiGet<WishlistItem[]>("/wishlist")
      .then(setItems)
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/login");
          return;
        }
        setMessage(reason.message);
      });
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(productId: number) {
    await apiDelete(`/wishlist/${productId}`);
    setMessage("Đã xóa khỏi danh sách yêu thích.");
    load();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Danh sách yêu thích</h1>
      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => item.product ? (
          <div key={item.id}>
            <ProductCard product={item.product} />
            <button type="button" onClick={() => remove(item.product_id)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
              Xóa
            </button>
          </div>
        ) : null)}
      </div>
      {items.length === 0 ? <div className="mt-6"><EmptyState title="Chưa có sản phẩm yêu thích" message="Lưu sản phẩm để xem lại và mua nhanh hơn." action={<Button variant="secondary" onClick={() => router.push("/products")}>Khám phá sản phẩm</Button>} /></div> : null}
    </main>
  );
}
