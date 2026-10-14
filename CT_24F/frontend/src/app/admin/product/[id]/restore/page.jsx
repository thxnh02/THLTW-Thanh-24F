"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import ConfirmActionPage from "@/components/admin/ConfirmActionPage";
import productServices from "@/services/productServices";

export default function RestoreProductPage() {
  const { id } = useParams();
  const load = useCallback(() => productServices.getTrashedProduct(id), [id]);
  const submit = useCallback(() => productServices.restoreProduct(id), [id]);

  return <ConfirmActionPage actionLabel="Khôi phục sản phẩm" backHref="/admin/product/trash" load={load} recordLabel={(record) => `${record.name} · ${record.slug}`} submit={submit} successHref="/admin/product" title="Khôi phục sản phẩm này?" warning="Sản phẩm sẽ trở lại trang quản trị. Cần khôi phục danh mục và thương hiệu trước nếu chúng đang ở trong thùng rác." />;
}
