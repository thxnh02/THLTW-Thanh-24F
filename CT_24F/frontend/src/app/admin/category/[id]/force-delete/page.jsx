"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import ConfirmActionPage from "@/components/admin/ConfirmActionPage";
import categoryServices from "@/services/categoryServices";

export default function ForceDeleteCategoryPage() {
  const { id } = useParams();
  const load = useCallback(() => categoryServices.getTrashedCategory(id), [id]);
  const submit = useCallback(() => categoryServices.forceDeleteCategory(id), [id]);

  return <ConfirmActionPage actionLabel="Delete permanently" backHref="/admin/category/trash" load={load} recordLabel={(record) => `${record.name} · ${record.slug}`} submit={submit} successHref="/admin/category/trash" title="Permanently delete this category?" warning="This action cannot be undone. Any product or child-category history blocks permanent deletion." />;
}
