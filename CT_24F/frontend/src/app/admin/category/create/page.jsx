"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CategoryForm from "@/components/admin/CategoryForm";
import categoryServices from "@/services/categoryServices";

export default function CreateCategoryPage() {
  const router = useRouter(); const [categories, setCategories] = useState([]); const [errors, setErrors] = useState({}); const [submitting, setSubmitting] = useState(false);
  useEffect(() => { categoryServices.getAdminCategories({ per_page: 100 }).then((response) => setCategories(response.data.data)); }, []);
  const save = async (data) => { setSubmitting(true); setErrors({}); try { await categoryServices.createCategory(data); router.push("/admin/category"); } catch (error) { setErrors(error.response?.data?.errors ?? {}); } finally { setSubmitting(false); } };
  return <section><h1 className="mb-4 text-2xl font-bold">Thêm danh mục</h1><CategoryForm categories={categories} errors={errors} onSubmit={save} submitting={submitting} /></section>;
}
