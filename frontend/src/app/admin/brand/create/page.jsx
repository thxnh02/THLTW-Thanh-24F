"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BrandForm from "@/components/admin/BrandForm";
import AdminErrorDialog from "@/components/admin/AdminErrorDialog";
import brandServices from "@/services/brandServices";

// Trang /admin/brand/create: hiển thị form thêm thương hiệu.
export default function CreateBrandPage() {
  const router = useRouter();
  const [errors, setErrors] = useState({});
  const [popup, setPopup] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Nhận dữ liệu từ BrandForm, gọi API tạo thương hiệu rồi về trang danh sách.
  const save = async (data) => {
    setSubmitting(true);
    setErrors({});
    setPopup("");
    try {
      await brandServices.createBrand(data);
      router.push("/admin/brand");
    } catch (error) {
      setErrors(error.response?.data?.errors ?? {});
      setPopup(error.response?.data?.message ?? "Không thể lưu thương hiệu.");
    } finally {
      setSubmitting(false);
    }
  };

  return <section className="mx-auto max-w-5xl space-y-5"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Thương hiệu</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Thêm thương hiệu</h1><p className="mt-2 text-sm text-slate-600">Thêm thông tin để liên kết thương hiệu với sản phẩm.</p></header><BrandForm errors={errors} onError={setPopup} onSubmit={save} submitting={submitting} /><AdminErrorDialog errors={errors} message={popup} onClose={() => setPopup("")} /></section>;
}
