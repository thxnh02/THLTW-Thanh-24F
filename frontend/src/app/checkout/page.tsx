"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { useCart } from "@/contexts/CartContext";
import { apiGet, apiPost } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { ShippingMethod } from "@/types/api";

type CheckoutResponse = {
  code: string;
  grand_total: string | number;
  payment_url?: string;
};

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    note: "",
    promotionCode: "",
    paymentMethod: "cod",
    shippingMethodId: "",
  });
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const selectedShipping = shippingMethods.find((method) => String(method.id) === form.shippingMethodId);

  useEffect(() => {
    apiGet<ShippingMethod[]>(`/shipping-methods?subtotal=${subtotal}`)
      .then((methods) => {
        setShippingMethods(methods);
        setForm((current) => current.shippingMethodId || methods.length === 0 ? current : { ...current, shippingMethodId: String(methods[0].id) });
      })
      .catch((reason: Error) => setError(reason.message));
  }, [subtotal]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const order = await apiPost<CheckoutResponse>("/checkout", {
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
        },
        note: form.note || undefined,
        payment_method: form.paymentMethod,
        shipping_method_id: form.shippingMethodId ? Number(form.shippingMethodId) : undefined,
        promotion_code: form.promotionCode || undefined,
        idempotency_key: window.crypto.randomUUID(),
        items: items.map((item) => ({
          variant_id: item.variantId,
          quantity: item.quantity,
        })),
      });
      clearCart();
      if (order.payment_url) {
        window.location.href = order.payment_url;
        return;
      }
      setMessage(`Dat hang thanh cong. Ma don: ${order.code}. Tong tien: ${formatVnd(order.grand_total)}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Checkout that bai.");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0 && !message) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-md border border-slate-200 bg-white p-8">
          <h1 className="text-2xl font-bold">Chua co san pham de thanh toan</h1>
          <Link href="/products" className="mt-4 inline-block rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
            Quay lai mua sam
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Thanh toan</h1>
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <Input label="Ho ten" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
        <Input label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
        <Input label="So dien thoai" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} required />
        <Input label="Dia chi giao hang" value={form.address} onChange={(value) => setForm({ ...form, address: value })} required />
        <Input label="Ma giam gia" value={form.promotionCode} onChange={(value) => setForm({ ...form, promotionCode: value.toUpperCase() })} />
        <label className="block text-sm font-semibold text-slate-700">
          Phuong thuc van chuyen
          <select value={form.shippingMethodId} onChange={(event) => setForm({ ...form, shippingMethodId: event.target.value })} className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 font-normal">
            {shippingMethods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.name} - {formatVnd(method.fee)}
              </option>
            ))}
          </select>
          {selectedShipping ? (
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Du kien {selectedShipping.estimated_days_min ?? "?"}-{selectedShipping.estimated_days_max ?? "?"} ngay.
            </span>
          ) : null}
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Ghi chu
          <textarea
            value={form.note}
            onChange={(event) => setForm({ ...form, note: event.target.value })}
            className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-950"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Phuong thuc thanh toan
          <select value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })} className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 font-normal">
            <option value="cod">COD</option>
            <option value="vnpay">VNPay Sandbox</option>
          </select>
        </label>
        {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
        <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
          <p>Tam tinh: <strong>{formatVnd(subtotal)}</strong></p>
          <p>Phi van chuyen: <strong>{formatVnd(selectedShipping?.fee ?? 0)}</strong></p>
        </div>
        <button
          disabled={submitting}
          className="rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:bg-slate-300"
        >
          {submitting ? "Dang xu ly..." : "Dat hang"}
        </button>
      </form>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950"
      />
    </label>
  );
}
