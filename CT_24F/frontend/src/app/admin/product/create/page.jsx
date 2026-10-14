"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import brandServices from "@/services/brandServices";
import categoryServices from "@/services/categoryServices";
import productServices from "@/services/productServices";

export default function CreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let current = true;
    Promise.all([categoryServices.getAdminCategoryOptions(), brandServices.getAdminBrandOptions()]).then(([categoryResponse, brandResponse]) => {
      if (!current) return;
      setCategories(categoryResponse.data.data);
      setBrands(brandResponse.data.data);
    }).catch((error) => {
      if (current) setRequestError(error.response?.data?.message ?? "Không thể tải danh mục và thương hiệu.");
    }).finally(() => {
      if (current) setOptionsLoading(false);
    });
    return () => { current = false; };
  }, []);

  const save = async (data) => {
    setSubmitting(true);
    setErrors({});
    setRequestError("");
    try {
      await productServices.createProduct(data);
      router.push("/admin/product");
    } catch (error) {
      setErrors(error.response?.data?.errors ?? {});
      setRequestError(error.response?.data?.message ?? "Không thể lưu sản phẩm.");
    } finally {
      setSubmitting(false);
    }
  };

  return <section className="mx-auto max-w-4xl space-y-5"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Danh mục cửa hàng</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Thêm sản phẩm</h1><p className="mt-2 text-sm text-slate-600">Nhập thông tin sản phẩm để hiển thị trên cửa hàng.</p></header>{requestError && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{requestError}</p>}{optionsLoading ? <p aria-live="polite" className="animate-pulse rounded-lg bg-white p-5 text-sm text-slate-500">Đang tải danh mục và thương hiệu…</p> : <ProductForm brands={brands} categories={categories} errors={errors} onSubmit={save} submitting={submitting} />}</section>;
}
