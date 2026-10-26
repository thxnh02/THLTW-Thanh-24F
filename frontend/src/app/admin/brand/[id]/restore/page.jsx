"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import ConfirmActionPage from "@/components/admin/ConfirmActionPage";
import brandServices from "@/services/brandServices";

// Trang xác nhận khôi phục một thương hiệu từ thùng rác.
export default function RestoreBrandPage() {
  const { id } = useParams();
  const load = useCallback(() => brandServices.getTrashedBrand(id), [id]);
  const submit = useCallback(() => brandServices.restoreBrand(id), [id]);

  return <ConfirmActionPage actionLabel="Khôi phục thương hiệu" backHref="/admin/brand/trash" load={load} recordLabel={(record) => `${record.name} · ${record.slug}`} submit={submit} successHref="/admin/brand" title="Khôi phục thương hiệu này?" warning="Thương hiệu sẽ trở lại trang quản trị và giữ nguyên trạng thái hiển thị." />;
}
