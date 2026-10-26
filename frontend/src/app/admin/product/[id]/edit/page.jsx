"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import brandServices from "@/services/brandServices";
import categoryServices from "@/services/categoryServices";
import productServices from "@/services/productServices";

// Trang /admin/product/[id]/edit: sửa sản phẩm đã có theo ID trên URL.
export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Tải sản phẩm hiện tại và các lựa chọn danh mục, thương hiệu vào form.
  useEffect(() => {
    let current = true;
    Promise.all([productServices.getAdminProduct(id), categoryServices.getAdminCategoryOptions(), brandServices.getAdminBrandOptions()]).then(([productResponse, categoryResponse, brandResponse]) => {
      if (!current) return;
      setProduct(productResponse.data.data);
      setCategories(categoryResponse.data.data);
      setBrands(brandResponse.data.data);
    }).catch((requestError) => {
      if (current) setError(requestError.response?.data?.message ?? "Không thể tải sản phẩm hoặc các lựa chọn danh mục, thương hiệu.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [id]);

  // Khác trang thêm: save() ở đây gọi API cập nhật sản phẩm theo ID.
  const save = async (data) => {
    setSubmitting(true);
    setErrors({});
    setError("");
    try {
      await productServices.updateProduct(id, data);
      router.push("/admin/product");
    } catch (requestError) {
      setErrors(requestError.response?.data?.errors ?? {});
      setError(requestError.response?.data?.message ?? "Không thể lưu sản phẩm.");
    } finally {
      setSubmitting(false);
    }
  };

  return <section className="mx-auto max-w-4xl space-y-5"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Danh mục cửa hàng</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Sửa sản phẩm</h1></header>{error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</p>}{loading ? <p aria-live="polite" className="animate-pulse rounded-lg bg-white p-5 text-sm text-slate-500">Đang tải sản phẩm…</p> : product && <ProductForm key={id} brands={brands} categories={categories} errors={errors} initialData={product} onSubmit={save} submitting={submitting} />}</section>;
}
