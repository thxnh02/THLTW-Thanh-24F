"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import ConfirmActionPage from "@/components/admin/ConfirmActionPage";
import brandServices from "@/services/brandServices";

export default function ForceDeleteBrandPage() {
  const { id } = useParams();
  const load = useCallback(() => brandServices.getTrashedBrand(id), [id]);
  const submit = useCallback(() => brandServices.forceDeleteBrand(id), [id]);

  return <ConfirmActionPage actionLabel="Delete permanently" backHref="/admin/brand/trash" load={load} recordLabel={(record) => `${record.name} · ${record.slug}`} submit={submit} successHref="/admin/brand/trash" title="Permanently delete this brand?" warning="This action cannot be undone. Product history linked to the brand blocks permanent deletion." />;
}
