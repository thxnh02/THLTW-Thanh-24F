"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import ConfirmActionPage from "@/components/admin/ConfirmActionPage";
import productServices from "@/services/productServices";

export default function ForceDeleteProductPage() {
  const { id } = useParams();
  const load = useCallback(() => productServices.getTrashedProduct(id), [id]);
  const submit = useCallback(() => productServices.forceDeleteProduct(id), [id]);

  return <ConfirmActionPage actionLabel="Delete permanently" backHref="/admin/product/trash" load={load} recordLabel={(record) => `${record.name} · ${record.slug}`} submit={submit} successHref="/admin/product/trash" title="Permanently delete this product?" warning="This permanently deletes the exact product shown above and cannot be undone." />;
}
