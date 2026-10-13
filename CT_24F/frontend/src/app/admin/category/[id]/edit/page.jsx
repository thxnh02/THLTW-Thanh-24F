"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CategoryForm from "@/components/admin/CategoryForm";
import categoryServices from "@/services/categoryServices";

export default function EditCategoryPage() {
  const { id } = useParams(); const router = useRouter(); const [category, setCategory] = useState(null); const [categories, setCategories] = useState([]); const [errors, setErrors] = useState({}); const [submitting, setSubmitting] = useState(false);
  useEffect(() => { Promise.all([categoryServices.getAdminCategory(id), categoryServices.getAdminCategories({ per_page: 100 })]).then(([one, all]) => { setCategory(one.data.data); setCategories(all.data.data); }); }, [id]);
  const save = async (data) => { setSubmitting(true); setErrors({}); try { await categoryServices.updateCategory(id, data); router.push("/admin/category"); } catch (error) { setErrors(error.response?.data?.errors ?? {}); } finally { setSubmitting(false); } };
  return <section><h1 className="mb-4 text-2xl font-bold">Sửa danh mục</h1>{category ? <CategoryForm categories={categories} errors={errors} initialData={category} onSubmit={save} submitting={submitting} /> : <p>Đang tải...</p>}</section>;
}
