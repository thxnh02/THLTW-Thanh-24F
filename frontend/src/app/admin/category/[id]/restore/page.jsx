"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import ConfirmActionPage from "@/components/admin/ConfirmActionPage";
import categoryServices from "@/services/categoryServices";

// Trang xác nhận khôi phục một danh mục từ thùng rác.
export default function RestoreCategoryPage() {
  const { id } = useParams();
  const load = useCallback(() => categoryServices.getTrashedCategory(id), [id]);
  const submit = useCallback(() => categoryServices.restoreCategory(id), [id]);

  return <ConfirmActionPage actionLabel="Khôi phục danh mục" backHref="/admin/category/trash" load={load} recordLabel={(record) => `${record.name} · ${record.slug}`} submit={submit} successHref="/admin/category" title="Khôi phục danh mục này?" warning="Danh mục sẽ trở lại trang quản trị. Cần khôi phục danh mục cha trước nếu danh mục cha đang ở trong thùng rác." />;
}
