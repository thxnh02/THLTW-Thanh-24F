"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import ConfirmActionPage from "@/components/admin/ConfirmActionPage";
import productServices from "@/services/productServices";

export default function RestoreProductPage() {
  const { id } = useParams();
  const load = useCallback(() => productServices.getTrashedProduct(id), [id]);
  const submit = useCallback(() => productServices.restoreProduct(id), [id]);

  return <ConfirmActionPage actionLabel="Restore product" backHref="/admin/product/trash" load={load} recordLabel={(record) => `${record.name} · ${record.slug}`} submit={submit} successHref="/admin/product" title="Restore this product?" warning="The product will return to the admin catalog. Its category and brand must be available before restoration." />;
}
