"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import AdminErrorDialog from "@/components/admin/AdminErrorDialog";
import brandServices from "@/services/brandServices";
import categoryServices from "@/services/categoryServices";
import productServices from "@/services/productServices";

// Trang /admin/product/create: hiển thị form thêm sản phẩm và xử lý kết quả lưu.
export default function CreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [errors, setErrors] = useState({});
  const [popup, setPopup] = useState("");
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Tải danh mục và thương hiệu để chọn khi nhập sản phẩm mới.
  useEffect(() => {
    let current = true;
    Promise.all([categoryServices.getAdminCategoryOptions(), brandServices.getAdminBrandOptions()]).then(([categoryResponse, brandResponse]) => {
      if (!current) return;
      setCategories(categoryResponse.data.data);
      setBrands(brandResponse.data.data);
    }).catch((error) => {
      if (current) setPopup(error.response?.data?.message ?? "Không thể tải danh mục và thương hiệu.");
    }).finally(() => {
      if (current) setOptionsLoading(false);
    });
    return () => { current = false; };
  }, []);

  // Hàm save của trang thêm sản phẩm: nhận dữ liệu từ ProductForm, gọi API tạo mới rồi trở về danh sách.
  const save = async (data) => {
    setSubmitting(true);
    setErrors({});
    setPopup("");
    try {
      await productServices.createProduct(data);
      router.push("/admin/product");
    } catch (error) {
      setErrors(error.response?.data?.errors ?? {});
      setPopup(error.response?.data?.message ?? "Không thể lưu sản phẩm.");
    } finally {
      setSubmitting(false);
    }
  };

  // onSubmit={save} nối nút Lưu trong ProductForm với hàm save ở trang này.
  return <section className="mx-auto max-w-6xl space-y-5"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Danh mục cửa hàng</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Thêm sản phẩm</h1><p className="mt-2 text-sm text-slate-600">Nhập thông tin, giá và hình ảnh trong một bố cục gọn gàng.</p></header>{optionsLoading ? <p aria-live="polite" className="animate-pulse rounded-lg bg-white p-5 text-sm text-slate-500">Đang tải danh mục và thương hiệu…</p> : <ProductForm brands={brands} categories={categories} errors={errors} onError={setPopup} onSubmit={save} submitting={submitting} />}<AdminErrorDialog errors={errors} message={popup} onClose={() => setPopup("")} /></section>;
}
