"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiGetList, apiPost } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { InventoryMovement, Product, StockDocument } from "@/types/api";

type StockForm = {
  type: "import" | "export";
  product_variant_id: string;
  quantity: string;
  unit_cost: string;
  supplier: string;
  reason: string;
  note: string;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [documents, setDocuments] = useState<StockDocument[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [form, setForm] = useState<StockForm>(emptyForm);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    Promise.all([
      apiGetList<Product>("/admin/products?per_page=100"),
      apiGetList<StockDocument>("/admin/stock"),
      apiGetList<InventoryMovement>("/admin/stock/movements"),
    ])
      .then(([productPayload, documentPayload, movementPayload]) => {
        setProducts(productPayload);
        setDocuments(documentPayload);
        setMovements(movementPayload);
      })
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/admin/login");
          return;
        }
        setMessage(reason.message);
      });
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      await apiPost("/admin/stock", {
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
      setMessage("Da ghi nhan phieu kho.");
      setForm(emptyForm);
      load();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Khong the ghi nhan phieu kho.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Quan ly kho</h1>
      <form onSubmit={submit} className="mt-6 grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-6">
        <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as StockForm["type"] })} className="h-10 rounded-md border border-slate-300 px-3">
          <option value="import">Nhap kho</option>
          <option value="export">Xuat kho</option>
        </select>
        <select required value={form.product_variant_id} onChange={(event) => setForm({ ...form, product_variant_id: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3 lg:col-span-2">
          <option value="">Chon variant</option>
          {products.map((product) => product.default_variant ? (
            <option key={product.default_variant.id} value={product.default_variant.id}>
              {product.name} - {product.default_variant.sku} - ton {product.default_variant.stock_quantity}
            </option>
          ) : null)}
        </select>
        <input type="number" min="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3" />
        <input type="number" placeholder="Gia von" value={form.unit_cost} onChange={(event) => setForm({ ...form, unit_cost: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3" />
        <input placeholder={form.type === "import" ? "Nha cung cap" : "Ly do"} value={form.type === "import" ? form.supplier : form.reason} onChange={(event) => setForm(form.type === "import" ? { ...form, supplier: event.target.value } : { ...form, reason: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3" />
        <input placeholder="Ghi chu" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} className="h-10 rounded-md border border-slate-300 px-3 lg:col-span-5" />
        <button className="rounded-md bg-slate-950 px-4 text-sm font-semibold text-white">Ghi phieu</button>
      </form>
      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}

      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-950">Phieu kho</h2>
        <div className="mt-3 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr><th className="p-3">Ma</th><th className="p-3">Loai</th><th className="p-3">Mat hang</th><th className="p-3">Ghi chu</th></tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id} className="border-t border-slate-200">
                  <td className="p-3 font-semibold">{document.code}</td>
                  <td className="p-3">{document.type}</td>
                  <td className="p-3">{document.items?.map((item) => `${item.variant?.sku} x ${item.quantity}`).join(", ")}</td>
                  <td className="p-3">{document.note ?? document.supplier ?? document.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-950">Lich su ton kho</h2>
        <div className="mt-3 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr><th className="p-3">SKU</th><th className="p-3">Thay doi</th><th className="p-3">Sau do</th><th className="p-3">Ly do</th><th className="p-3">Gia</th></tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={movement.id} className="border-t border-slate-200">
                  <td className="p-3 font-semibold">{movement.variant?.sku}</td>
                  <td className="p-3">{movement.quantity_change}</td>
                  <td className="p-3">{movement.balance_after}</td>
                  <td className="p-3">{movement.reason}</td>
                  <td className="p-3">{formatVnd(movement.variant?.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
