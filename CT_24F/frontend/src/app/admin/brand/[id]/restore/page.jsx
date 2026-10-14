"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import ConfirmActionPage from "@/components/admin/ConfirmActionPage";
import brandServices from "@/services/brandServices";

export default function RestoreBrandPage() {
  const { id } = useParams();
  const load = useCallback(() => brandServices.getTrashedBrand(id), [id]);
  const submit = useCallback(() => brandServices.restoreBrand(id), [id]);

  return <ConfirmActionPage actionLabel="Restore brand" backHref="/admin/brand/trash" load={load} recordLabel={(record) => `${record.name} · ${record.slug}`} submit={submit} successHref="/admin/brand" title="Restore this brand?" warning="The brand will be available for admin use again. Its visibility status is preserved." />;
}
