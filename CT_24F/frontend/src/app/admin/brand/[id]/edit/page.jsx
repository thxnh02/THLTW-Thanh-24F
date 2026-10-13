"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BrandForm from "@/components/admin/BrandForm";
import brandServices from "@/services/brandServices";

export default function EditBrandPage() {
  const { id } = useParams(); const router = useRouter(); const [brand, setBrand] = useState(null); const [errors, setErrors] = useState({}); const [submitting, setSubmitting] = useState(false);
  useEffect(() => { brandServices.getAdminBrand(id).then((response) => setBrand(response.data.data)); }, [id]);
  const save = async (data) => { setSubmitting(true); setErrors({}); try { await brandServices.updateBrand(id, data); router.push("/admin/brand"); } catch (error) { setErrors(error.response?.data?.errors ?? {}); } finally { setSubmitting(false); } };
  return <section><h1 className="mb-4 text-2xl font-bold">Sửa thương hiệu</h1>{brand ? <BrandForm errors={errors} initialData={brand} onSubmit={save} submitting={submitting} /> : <p>Đang tải...</p>}</section>;
}
