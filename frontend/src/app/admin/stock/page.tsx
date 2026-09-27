"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ApiError, apiGet, apiGetPaginated, apiPost } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { InventoryMovement, PaginatedMeta, ProductVariantOption, StockDocument } from "@/types/api";
import { Pagination } from "@/components/admin/Pagination";

type StockForm = {
  type: "import" | "export";
  product_variant_id: string;
  quantity: string;
  unit_cost: string;
  supplier: string;
  reason: string;
  note: string;
};

type StockFilters = {
  type: "" | "import" | "export";
  q: string;
  variant_id: string;
};

const emptyForm: StockForm = {
  type: "import",
  product_variant_id: "",
  quantity: "1",
  unit_cost: "",
  supplier: "",
  reason: "",
  note: "",
};

export default function AdminStockPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const [variants, setVariants] = useState<ProductVariantOption[]>([]);
  const [documents, setDocuments] = useState<StockDocument[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [documentMeta, setDocumentMeta] = useState<PaginatedMeta>({});
  const [movementMeta, setMovementMeta] = useState<PaginatedMeta>({});
  const [form, setForm] = useState<StockForm>(emptyForm);
  const [filters, setFilters] = useState<StockFilters>({
    type: searchParams.get("type") === "export" ? "export" : searchParams.get("type") === "import" ? "import" : "",
    q: searchParams.get("q") ?? "",
    variant_id: searchParams.get("variant_id") ?? "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams(queryString);
    const documentQuery = new URLSearchParams();
    const movementQuery = new URLSearchParams();

    if (params.get("type")) {
      documentQuery.set("type", params.get("type") as string);
    }

    if (params.get("q")) {
      documentQuery.set("q", params.get("q") as string);
    }

    if (params.get("variant_id")) {
      movementQuery.set("variant_id", params.get("variant_id") as string);
    }

    documentQuery.set("page", params.get("documents_page") ?? "1");
    documentQuery.set("per_page", "10");
    movementQuery.set("page", params.get("movements_page") ?? "1");
    movementQuery.set("per_page", "10");

    try {
      const [variantOptions, documentResult, movementResult] = await Promise.all([
        apiGet<ProductVariantOption[]>("/admin/options/product-variants"),
        apiGetPaginated<StockDocument>(`/admin/stock?${documentQuery.toString()}`),
        apiGetPaginated<InventoryMovement>(`/admin/stock/movements?${movementQuery.toString()}`),
      ]);

      setVariants(variantOptions);
      setDocuments(documentResult.data);
      setDocumentMeta(documentResult.meta);
      setMovements(movementResult.data);
      setMovementMeta(movementResult.meta);
      setMessage("");
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        router.push("/admin/login");
        return;
      }

      setMessage(reason instanceof Error ? reason.message : "Không thể tải dữ liệu kho.");
    } finally {
      setLoading(false);
    }
  }, [queryString, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams(queryString);

    if (filters.type) {
      next.set("type", filters.type);
    } else {
      next.delete("type");
    }

    if (filters.q.trim()) {
      next.set("q", filters.q.trim());
    } else {
      next.delete("q");
    }

    if (filters.variant_id) {
      next.set("variant_id", filters.variant_id);
    } else {
      next.delete("variant_id");
    }

    next.delete("documents_page");
    next.delete("movements_page");
    router.push(`/admin/stock?${next.toString()}`);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      await apiPost<StockDocument>("/admin/stock", {
        type: form.type,
        supplier: form.supplier || undefined,
        reason: form.reason || undefined,
        note: form.note || undefined,
        items: [
          {
            product_variant_id: Number(form.product_variant_id),
            quantity: Number(form.quantity),
            unit_cost: form.unit_cost ? Number(form.unit_cost) : undefined,
          },
        ],
      });

      setMessage("Đã ghi nhận phiếu kho.");
      setForm(emptyForm);
      await load();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Không thể ghi nhận phiếu kho.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-950">Quản lý kho</h1>
        <p className="mt-1 text-sm text-slate-600">Nhập, xuất và theo dõi tồn kho theo từng biến thể sản phẩm.</p>
      </div>

      <form onSubmit={applyFilters} className="mb-5 grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <select aria-label="Lọc loại phiếu" value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value as StockFilters["type"] }))} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">Tất cả loại phiếu</option>
          <option value="import">Nhập kho</option>
          <option value="export">Xuất kho</option>
        </select>
        <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Tìm mã phiếu" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        <select aria-label="Lọc biến thể" value={filters.variant_id} onChange={(event) => setFilters((current) => ({ ...current, variant_id: event.target.value }))} className="h-10 rounded-md border border-slate-300 px-3 text-sm md:col-span-2">
          <option value="">Tất cả biến thể trong lịch sử</option>
          {variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.product.name} — {variant.name} — {variant.sku}</option>)}
        </select>
        <button className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white md:col-span-4">Áp dụng bộ lọc</button>
      </form>

      <form onSubmit={submit} className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-6">
        <label className="text-sm font-semibold text-slate-700">
          Loại phiếu
          <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as StockForm["type"] }))} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal">
            <option value="import">Nhập kho</option>
            <option value="export">Xuất kho</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700 lg:col-span-2">
          Biến thể sản phẩm
          <select required value={form.product_variant_id} onChange={(event) => setForm((current) => ({ ...current, product_variant_id: event.target.value }))} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" disabled={loading}>
            <option value="">{loading ? "Đang tải biến thể..." : "Chọn biến thể"}</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.product.name} — {variant.name || variant.sku} — {variant.sku} — tồn {variant.stock_quantity}{variant.active ? "" : " — ngừng bán"}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Số lượng
          <input type="number" min="1" required value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Giá vốn
          <input type="number" min="0" value={form.unit_cost} onChange={(event) => setForm((current) => ({ ...current, unit_cost: event.target.value }))} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          {form.type === "import" ? "Nhà cung cấp" : "Lý do"}
          <input value={form.type === "import" ? form.supplier : form.reason} onChange={(event) => setForm((current) => form.type === "import" ? { ...current, supplier: event.target.value } : { ...current, reason: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" />
        </label>
        <label className="text-sm font-semibold text-slate-700 lg:col-span-5">
          Ghi chú
          <input value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" />
        </label>
        <button disabled={saving || loading} className="h-10 self-end rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? "Đang ghi..." : "Ghi phiếu"}
        </button>
      </form>

      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}

      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-950">Phiếu kho</h2>
        <div className="mt-3 overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr><th className="p-3">Mã phiếu</th><th className="p-3">Loại</th><th className="p-3">Mặt hàng</th><th className="p-3">Ghi chú</th></tr>
            </thead>
            <tbody>
              {documents.length ? documents.map((document) => (
                <tr key={document.id} className="border-t border-slate-200">
                  <td className="p-3 font-semibold">{document.code}</td>
                  <td className="p-3">{document.type === "import" ? "Nhập kho" : "Xuất kho"}</td>
                  <td className="p-3">{document.items?.map((item) => `${item.variant?.product?.name ?? "Sản phẩm"} — ${item.variant?.name ?? item.variant?.sku ?? item.product_variant_id} (${item.variant?.sku ?? "SKU"}) × ${item.quantity}`).join(", ")}</td>
                  <td className="p-3">{document.note ?? document.supplier ?? document.reason ?? "-"}</td>
                </tr>
              )) : <tr><td colSpan={4} className="p-8 text-center text-slate-500">Chưa có phiếu kho.</td></tr>}
            </tbody>
          </table>
          <Pagination meta={documentMeta} pageParam="documents_page" />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-950">Lịch sử tồn kho</h2>
        <div className="mt-3 overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr><th className="p-3">Biến thể</th><th className="p-3">Thay đổi</th><th className="p-3">Tồn hiện tại</th><th className="p-3">Lý do</th><th className="p-3">Giá</th></tr>
            </thead>
            <tbody>
              {movements.length ? movements.map((movement) => (
                <tr key={movement.id} className="border-t border-slate-200">
                  <td className="p-3 font-semibold">{movement.variant?.product?.name ?? "Sản phẩm"} — {movement.variant?.name ?? movement.variant?.sku} ({movement.variant?.sku})</td>
                  <td className={`p-3 font-semibold ${movement.quantity_change < 0 ? "text-rose-700" : "text-emerald-700"}`}>{movement.quantity_change > 0 ? `+${movement.quantity_change}` : movement.quantity_change}</td>
                  <td className="p-3">{movement.balance_after}</td>
                  <td className="p-3">{movement.reason}</td>
                  <td className="p-3">{formatVnd(movement.variant?.price)}</td>
                </tr>
              )) : <tr><td colSpan={5} className="p-8 text-center text-slate-500">Chưa có lịch sử tồn kho.</td></tr>}
            </tbody>
          </table>
          <Pagination meta={movementMeta} pageParam="movements_page" />
        </div>
      </section>
    </main>
  );
}
