"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CategoryForm from "@/components/admin/CategoryForm";
import categoryServices from "@/services/categoryServices";

export default function EditCategoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let current = true;
    Promise.all([categoryServices.getAdminCategory(id), categoryServices.getAdminCategoryOptions()]).then(([one, options]) => {
      if (!current) return;
      setCategory(one.data.data);
      setCategories(options.data.data);
    }).catch((requestError) => {
      if (current) setError(requestError.response?.data?.message ?? "The category could not be loaded.");
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
      await categoryServices.updateCategory(id, data);
      router.push("/admin/category");
    } catch (requestError) {
      setErrors(requestError.response?.data?.errors ?? {});
      setError(requestError.response?.data?.message ?? "The category could not be saved.");
    } finally {
      setSubmitting(false);
    }
  };

  return <section className="mx-auto max-w-3xl space-y-5"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Category</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Edit category</h1></header>{error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</p>}{loading ? <p aria-live="polite" className="animate-pulse rounded-lg bg-white p-5 text-sm text-slate-500">Loading category…</p> : category && <CategoryForm key={id} categories={categories} errors={errors} initialData={category} onSubmit={save} submitting={submitting} />}</section>;
}
