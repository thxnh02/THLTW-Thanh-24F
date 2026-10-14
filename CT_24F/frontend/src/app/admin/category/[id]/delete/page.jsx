"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import ConfirmActionPage from "@/components/admin/ConfirmActionPage";
import categoryServices from "@/services/categoryServices";

export default function DeleteCategoryPage() {
  const { id } = useParams();
  const load = useCallback(() => categoryServices.getAdminCategory(id), [id]);
  const submit = useCallback(() => categoryServices.deleteCategory(id), [id]);

  return <ConfirmActionPage actionLabel="Move to trash" backHref={`/admin/category/${id}/edit`} load={load} recordLabel={(record) => `${record.name} · ${record.slug}`} submit={submit} successHref="/admin/category/trash" title="Move category to trash?" warning="This category will leave the storefront and move to trash. Related products or child categories may prevent this action." />;
}
