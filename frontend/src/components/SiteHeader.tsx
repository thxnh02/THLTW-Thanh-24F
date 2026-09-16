"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

export function SiteHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { totalQuantity } = useCart();
  const [query, setQuery] = useState("");

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-slate-950">
          THLTW Shop
        </Link>
        <nav className="flex flex-1 items-center gap-4 text-sm font-medium text-slate-700">
          <Link href="/products" className="hover:text-slate-950">
            San pham
          </Link>
          <Link href="/posts" className="hover:text-slate-950">
            Bai viet
          </Link>
          <Link href="/contact" className="hover:text-slate-950">
            Lien he
          </Link>
          <Link href="/admin" className="hover:text-slate-950">
            Admin
          </Link>
        </nav>
        <form action="/search" className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md">
          <label className="sr-only" htmlFor="site-search">
            Tim kiem
          </label>
          <input
            id="site-search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            placeholder="Tim san pham, SKU..."
          />
          <button className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
            Tim
          </button>
        </form>
        <Link
          href="/cart"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 hover:border-slate-950"
          aria-label="Gio hang"
        >
          Gio hang ({totalQuantity})
        </Link>
        <Link href="/wishlist" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 hover:border-slate-950">
          Wishlist
        </Link>
        {user ? (
          <div className="flex items-center gap-2">
            <Link href="/account/profile" className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200">
              Tai khoan
            </Link>
            <Link href="/account/addresses" className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200">
              Dia chi
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
            >
              Dang xuat
            </button>
          </div>
        ) : (
          <Link href="/login" className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white">
            Dang nhap
          </Link>
        )}
      </div>
    </header>
  );
}
