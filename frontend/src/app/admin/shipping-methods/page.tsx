"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiDelete, apiGetList, apiPatch, apiPost } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { ShippingMethod } from "@/types/api";

type FormState = {
  id?: number;
  name: string;
  code: string;
  description: string;
  fee: string;
  free_shipping_threshold: string;
  estimated_days_min: string;
  estimated_days_max: string;
  active: boolean;
  sort_order: string;
};

const emptyForm: FormState = {
  name: "",
  code: "",
  description: "",
  fee: "30000",
  free_shipping_threshold: "",
  estimated_days_min: "3",
  estimated_days_max: "5",
  active: true,
  sort_order: "0",
};

export default function AdminShippingMethodsPage() {
  const router = useRouter();
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    apiGetList<ShippingMethod>("/admin/shipping-methods")
      .then(setMethods)
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
    setSaving(true);
    setMessage("");
    const payload = {
      name: form.name,
      code: form.code,
      description: form.description || undefined,
      fee: Number(form.fee),
      free_shipping_threshold: form.free_shipping_threshold ? Number(form.free_shipping_threshold) : undefined,
      estimated_days_min: form.estimated_days_min ? Number(form.estimated_days_min) : undefined,
      estimated_days_max: form.estimated_days_max ? Number(form.estimated_days_max) : undefined,
      active: form.active,
      sort_order: Number(form.sort_order || 0),
    };

    try {
      if (form.id) {
        await apiPatch(`/admin/shipping-methods/${form.id}`, payload);
        setMessage("Da cap nhat phuong thuc van chuyen.");
      } else {
        await apiPost("/admin/shipping-methods", payload);
        setMessage("Da tao phuong thuc van chuyen.");
      }
      setForm(emptyForm);
      load();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Khong the luu.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(method: ShippingMethod) {
    await apiDelete(`/admin/shipping-methods/${method.id}`);
    setMessage("Da xoa hoac ngung su dung phuong thuc.");
    load();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Phuong thuc van chuyen</h1>
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-4">
        <Input label="Ten" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
        <Input label="Code" value={form.code} onChange={(value) => setForm({ ...form, code: value })} required />
        <Input label="Phi" type="number" value={form.fee} onChange={(value) => setForm({ ...form, fee: value })} required />
        <Input label="Mien phi tu" type="number" value={form.free_shipping_threshold} onChange={(value) => setForm({ ...form, free_shipping_threshold: value })} />
        <Input label="Ngay toi thieu" type="number" value={form.estimated_days_min} onChange={(value) => setForm({ ...form, estimated_days_min: value })} />
        <Input label="Ngay toi da" type="number" value={form.estimated_days_max} onChange={(value) => setForm({ ...form, estimated_days_max: value })} />
        <Input label="Thu tu" type="number" value={form.sort_order} onChange={(value) => setForm({ ...form, sort_order: value })} />
        <label className="flex items-center gap-2 pt-7 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
          Dang bat
        </label>
        <label className="block text-sm font-semibold text-slate-700 lg:col-span-4">
          Mo ta
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 font-normal" />
        </label>
        <div className="flex gap-2 lg:col-span-4">
          <button disabled={saving} className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300">
            {saving ? "Dang luu..." : form.id ? "Cap nhat" : "Tao moi"}
          </button>
          {form.id ? <button type="button" onClick={() => setForm(emptyForm)} className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold">Huy</button> : null}
        </div>
      </form>
      {message ? <p className="mt-3 rounded-md bg-white p-3 text-sm text-slate-700">{message}</p> : null}
      <div className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr><th className="p-3">Ten</th><th className="p-3">Phi</th><th className="p-3">Du kien</th><th className="p-3">Status</th><th className="p-3">Thao tac</th></tr>
          </thead>
          <tbody>
            {methods.map((method) => (
              <tr key={method.id} className="border-t border-slate-200">
                <td className="p-3 font-semibold">{method.name}<p className="text-xs text-slate-500">{method.code}</p></td>
                <td className="p-3">{formatVnd(method.fee)}</td>
                <td className="p-3">{method.estimated_days_min ?? "?"}-{method.estimated_days_max ?? "?"} ngay</td>
                <td className="p-3">{method.active ? "Bat" : "Tat"}</td>
                <td className="flex gap-2 p-3">
                  <button type="button" onClick={() => setForm({
                    id: method.id,
                    name: method.name,
                    code: method.code,
                    description: method.description ?? "",
                    fee: String(method.fee),
                    free_shipping_threshold: String(method.free_shipping_threshold ?? ""),
                    estimated_days_min: String(method.estimated_days_min ?? ""),
                    estimated_days_max: String(method.estimated_days_max ?? ""),
                    active: Boolean(method.active),
                    sort_order: String(method.sort_order ?? 0),
                  })} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Sua</button>
                  <button type="button" onClick={() => remove(method)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Xoa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Input({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950" />
    </label>
  );
}
