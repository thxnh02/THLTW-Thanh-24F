"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CategoryForm from "@/components/admin/CategoryForm";
import categoryServices from "@/services/categoryServices";

// Trang /admin/category/create: thêm danh mục mới, có thể chọn danh mục cha.
export default function CreateCategoryPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Lấy danh mục hiện có để điền danh sách lựa chọn danh mục cha.
  useEffect(() => {
    categoryServices.getAdminCategoryOptions().then((response) => {
      setCategories(response.data.data);
    }).catch((requestError) => {
      setLoadError(requestError.response?.data?.message ?? "Không thể tải danh mục cha.");
    }).finally(() => setOptionsLoading(false));
  }, []);

  // Nhận dữ liệu từ CategoryForm, gọi API tạo danh mục rồi về trang danh sách.
  const save = async (data) => {
    setSubmitting(true);
    setErrors({});
    try {
      await categoryServices.createCategory(data);
      router.push("/admin/category");
    } catch (requestError) {
      setErrors(requestError.response?.data?.errors ?? {});
      setLoadError(requestError.response?.data?.message ?? "Không thể lưu danh mục.");
    } finally {
      setSubmitting(false);
    }
  };

  return <section className="mx-auto max-w-3xl space-y-5"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Danh mục</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Thêm danh mục</h1><p className="mt-2 text-sm text-slate-600">Thêm danh mục mới và chọn danh mục cha nếu cần.</p></header>{loadError && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{loadError}</p>}{optionsLoading ? <p aria-live="polite" className="animate-pulse rounded-lg bg-white p-5 text-sm text-slate-500">Đang tải danh mục cha…</p> : <CategoryForm categories={categories} errors={errors} onSubmit={save} submitting={submitting} />}</section>;
}
