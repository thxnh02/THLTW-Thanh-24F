"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BrandForm from "@/components/admin/BrandForm";
import brandServices from "@/services/brandServices";

export default function CreateBrandPage() {
  const router = useRouter(); const [errors, setErrors] = useState({}); const [submitting, setSubmitting] = useState(false);
  const save = async (data) => { setSubmitting(true); setErrors({}); try { await brandServices.createBrand(data); router.push("/admin/brand"); } catch (error) { setErrors(error.response?.data?.errors ?? {}); } finally { setSubmitting(false); } };
  return <section><h1 className="mb-4 text-2xl font-bold">Thêm thương hiệu</h1><BrandForm errors={errors} onSubmit={save} submitting={submitting} /></section>;
}
