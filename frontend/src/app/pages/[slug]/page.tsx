"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiGet } from "@/lib/api";
import type { Page } from "@/types/api";

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
      {error ? <p className="rounded-md bg-white p-4 text-red-600">{error}</p> : null}
      {!page && !error ? <p className="rounded-md bg-white p-4">Dang tai trang...</p> : null}
      {page ? (
        <article className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">{page.title}</h1>
          <div className="mt-6 whitespace-pre-line leading-7 text-slate-700">{page.content}</div>
        </article>
      ) : null}
    </main>
  );
}
