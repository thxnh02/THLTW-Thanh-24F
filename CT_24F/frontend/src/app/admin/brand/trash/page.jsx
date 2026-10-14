"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import TrashTable from "@/components/admin/TrashTable";
import brandServices from "@/services/brandServices";

export default function BrandTrashPage() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback((page = 1) => {
    setLoading(true);
    setError("");
    brandServices.getBrandTrash({ page }).then((response) => {
      setData(response.data.data);
      setMeta(response.data.meta);
    }).catch((requestError) => {
      setError(requestError.response?.data?.message ?? "Could not load the brand trash.");
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let current = true;
    brandServices.getBrandTrash({ page: 1 }).then((response) => {
      if (!current) return;
      setData(response.data.data);
      setMeta(response.data.meta);
    }).catch((requestError) => {
      if (current) setError(requestError.response?.data?.message ?? "Could not load the brand trash.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, []);

  const columns = [
    { key: "name", label: "Brand" },
    { key: "slug", label: "Slug" },
    { key: "status", label: "Visibility", render: (item) => <StatusBadge status={item.status} /> },
    { key: "deleted_at", label: "Deleted", render: (item) => item.deleted_at ? new Date(item.deleted_at).toLocaleString() : "—" },
  ];

  return <section className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Recovery</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Brand trash</h1><p className="mt-2 text-sm text-slate-600">Restore brands or review permanent deletion eligibility.</p></div><Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href="/admin/brand">Back to brands</Link></header>
    <TrashTable columns={columns} data={data} error={error} loading={loading} meta={meta} onPageChange={load} onRetry={() => load(meta?.current_page ?? 1)} renderActions={(item) => <div className="flex flex-wrap gap-3 whitespace-nowrap"><Link aria-label={`Restore brand ${item.name}`} className="font-semibold text-indigo-700 hover:underline" href={`/admin/brand/${item.id}/restore`}>Restore</Link><Link aria-label={`Permanently delete brand ${item.name}`} className="font-semibold text-rose-700 hover:underline" href={`/admin/brand/${item.id}/force-delete`}>Delete permanently</Link></div>} />
  </section>;
}
