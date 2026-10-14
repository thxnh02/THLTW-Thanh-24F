"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import ConfirmActionPage from "@/components/admin/ConfirmActionPage";
import categoryServices from "@/services/categoryServices";

export default function RestoreCategoryPage() {
  const { id } = useParams();
  const load = useCallback(() => categoryServices.getTrashedCategory(id), [id]);
  const submit = useCallback(() => categoryServices.restoreCategory(id), [id]);

  return <ConfirmActionPage actionLabel="Restore category" backHref="/admin/category/trash" load={load} recordLabel={(record) => `${record.name} · ${record.slug}`} submit={submit} successHref="/admin/category" title="Restore this category?" warning="The category will return to the admin catalog. Its parent category must already be restored." />;
}
