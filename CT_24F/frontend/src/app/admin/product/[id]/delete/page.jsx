"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import ConfirmActionPage from "@/components/admin/ConfirmActionPage";
import productServices from "@/services/productServices";

export default function DeleteProductPage() {
  const { id } = useParams();
  const load = useCallback(() => productServices.getAdminProduct(id), [id]);
  const submit = useCallback(() => productServices.deleteProduct(id), [id]);

  return <ConfirmActionPage actionLabel="Move to trash" backHref={`/admin/product/${id}/edit`} load={load} recordLabel={(record) => `${record.name} · ${record.slug}`} submit={submit} successHref="/admin/product/trash" title="Move product to trash?" warning="This product will no longer appear on the storefront. Its category and brand links are kept for possible restoration." />;
}
