"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminTable from "@/components/admin/AdminTable";
import StatusBadge from "@/components/admin/StatusBadge";
import Pagination from "@/components/common/Pagination";
import brandServices from "@/services/brandServices";

export default function AdminBrandsPage() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback((page = 1) => {
    setLoading(true);
    setError("");
    brandServices.getAdminBrands({ page }).then((response) => {
      setData(response.data.data);
      setMeta(response.data.meta);
    }).catch((requestError) => {
      setError(requestError.response?.data?.message ?? "Could not load brands.");
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let current = true;
    brandServices.getAdminBrands({ page: 1 }).then((response) => {
      if (!current) return;
      setData(response.data.data);
      setMeta(response.data.meta);
    }).catch((requestError) => {
      if (current) setError(requestError.response?.data?.message ?? "Could not load brands.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, []);

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "slug", label: "Slug" },
    { key: "sort_order", label: "Sort order" },
    { key: "status", label: "Visibility", render: (item) => <StatusBadge status={item.status} /> },
  ];

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Catalog partners</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Brands</h1><p className="mt-2 max-w-xl text-sm text-slate-600">Maintain brand details and visibility across the storefront.</p></div>
        <div className="flex flex-wrap gap-2">
          <Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href="/admin/brand/trash">View trash</Link>
          <Link className="inline-flex min-h-11 items-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href="/admin/brand/create">Add brand</Link>
        </div>
      </header>
      <AdminTable columns={columns} data={data} emptyMessage="No brands yet." error={error} loading={loading} onRetry={() => load(meta?.current_page ?? 1)} renderActions={(item) => <div className="flex flex-wrap gap-3 whitespace-nowrap"><Link aria-label={`Edit brand ${item.name}`} className="font-semibold text-indigo-700 hover:underline focus-visible:outline focus-visible:outline-2" href={`/admin/brand/${item.id}/edit`}>Edit</Link><Link aria-label={`Delete brand ${item.name}`} className="font-semibold text-rose-700 hover:underline focus-visible:outline focus-visible:outline-2" href={`/admin/brand/${item.id}/delete`}>Delete</Link></div>} />
      <Pagination meta={meta} onPageChange={load} />
    </section>
  );
}
