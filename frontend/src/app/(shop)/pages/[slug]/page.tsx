"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiGet } from "@/lib/api";
import type { Page } from "@/types/api";
import Link from "next/link";
import { ErrorState, Skeleton } from "@/components/ui";

export default function StaticPage() {
  const params = useParams<{ slug: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<Page>(`/pages/${params.slug}`)
      .then(setPage)
      .catch((reason: Error) => setError(reason.message));
  }, [params.slug]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <nav className="mb-5 text-sm text-slate-500" aria-label="Đường dẫn"><Link href="/" className="hover:text-teal-800">Trang chủ</Link><span className="px-2">/</span><span>Thông tin</span></nav>
      {error ? <ErrorState title="Không thể tải trang" message="Nội dung hiện không khả dụng." /> : null}
      {!page && !error ? <Skeleton className="h-72 w-full" /> : null}
      {page ? (
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-3xl font-bold text-slate-950">{page.title}</h1>
          <div className="mt-6 whitespace-pre-line text-base leading-8 text-slate-700">{page.content}</div>
        </article>
      ) : null}
    </main>
  );
}
