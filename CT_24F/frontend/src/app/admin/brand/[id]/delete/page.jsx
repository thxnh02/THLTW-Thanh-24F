"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import ConfirmActionPage from "@/components/admin/ConfirmActionPage";
import brandServices from "@/services/brandServices";

export default function DeleteBrandPage() {
  const { id } = useParams();
  const load = useCallback(() => brandServices.getAdminBrand(id), [id]);
  const submit = useCallback(() => brandServices.deleteBrand(id), [id]);

  return <ConfirmActionPage actionLabel="Move to trash" backHref={`/admin/brand/${id}/edit`} load={load} recordLabel={(record) => `${record.name} · ${record.slug}`} submit={submit} successHref="/admin/brand/trash" title="Move brand to trash?" warning="The brand will leave the storefront and move to trash. Products still linked to this brand may prevent this action." />;
}
