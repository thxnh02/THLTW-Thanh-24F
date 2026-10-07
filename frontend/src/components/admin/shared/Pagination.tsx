"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PaginatedMeta } from "@/types/api";

export function Pagination({ meta, pageParam = "page" }: { meta: PaginatedMeta; pageParam?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = meta.current_page ?? 1;
  const last = meta.last_page ?? 1;

  if (last <= 1) {
    return null;
  }

  function go(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(pageParam, String(page));
    router.push(`${pathname}?${params.toString()}`);
  }

  const pages = Array.from(new Set([1, current - 1, current, current + 1, last].filter((page) => page > 0 && page <= last)));

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm" aria-label="Phân trang">
      <span className="text-slate-500">{meta.total ?? 0} kết quả</span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={current <= 1} onClick={() => go(current - 1)} className="rounded-md border border-slate-300 px-3 py-2 font-semibold disabled:opacity-40">
          Trước
        </button>
        {pages.map((page) => (
          <button key={page} type="button" onClick={() => go(page)} className={`rounded-md px-3 py-2 font-semibold ${page === current ? "bg-slate-950 text-white" : "border border-slate-300"}`}>
            {page}
          </button>
        ))}
        <button type="button" disabled={current >= last} onClick={() => go(current + 1)} className="rounded-md border border-slate-300 px-3 py-2 font-semibold disabled:opacity-40">
          Sau
        </button>
      </div>
    </nav>
  );
}
