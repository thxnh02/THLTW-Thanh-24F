"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BrandForm from "@/components/admin/BrandForm";
import brandServices from "@/services/brandServices";

export default function EditBrandPage() {
  const { id } = useParams();
  const router = useRouter();
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let current = true;
    brandServices.getAdminBrand(id).then((response) => {
      if (current) setBrand(response.data.data);
    }).catch((requestError) => {
      if (current) setError(requestError.response?.data?.message ?? "The brand could not be loaded.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [id]);

  const save = async (data) => {
    setSubmitting(true);
    setErrors({});
    setError("");
    try {
      await brandServices.updateBrand(id, data);
      router.push("/admin/brand");
    } catch (requestError) {
      setErrors(requestError.response?.data?.errors ?? {});
      setError(requestError.response?.data?.message ?? "The brand could not be saved.");
    } finally {
      setSubmitting(false);
    }
  };

  return <section className="mx-auto max-w-3xl space-y-5"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Brand</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Edit brand</h1></header>{error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</p>}{loading ? <p aria-live="polite" className="animate-pulse rounded-lg bg-white p-5 text-sm text-slate-500">Loading brand…</p> : brand && <BrandForm key={id} errors={errors} initialData={brand} onSubmit={save} submitting={submitting} />}</section>;
}
