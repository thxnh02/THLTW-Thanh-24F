"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useConfirm } from "@/contexts/ConfirmContext";
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { Promotion } from "@/types/api";

type PromotionForm = {
  id?: number;
  code: string;
  type: "fixed" | "percent";
  value: string;
  min_order_amount: string;
  max_discount_amount: string;
  start_at: string;
  end_at: string;
  active: boolean;
  usage_limit: string;
  usage_limit_per_user: string;
};

const emptyForm: PromotionForm = {
  code: "",
  type: "percent",
  value: "",
  min_order_amount: "0",
  max_discount_amount: "",
  start_at: "",
  end_at: "",
  active: true,
  usage_limit: "",
  usage_limit_per_user: "1",
};

export default function AdminPromotionsPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [form, setForm] = useState<PromotionForm>(emptyForm);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    apiGet<{ data: Promotion[] }>("/admin/promotions")
      .then((payload) => setPromotions(payload.data ?? []))
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
    const payload = toPayload(form);

    if (form.id) {
      await apiPatch(`/admin/promotions/${form.id}`, payload);
      setMessage("Da cap nhat ma khuyen mai.");
    } else {
      await apiPost("/admin/promotions", payload);
      setMessage("Da tao ma khuyen mai.");
    }

    setForm(emptyForm);
    load();
  }

  function edit(promotion: Promotion) {
    setForm({
      id: promotion.id,
      code: promotion.code,
      type: promotion.type,
      value: String(promotion.value),
      min_order_amount: String(promotion.min_order_amount ?? 0),
      max_discount_amount: promotion.max_discount_amount ? String(promotion.max_discount_amount) : "",
      start_at: toDatetimeLocal(promotion.start_at),
      end_at: toDatetimeLocal(promotion.end_at),
      active: promotion.active,
      usage_limit: promotion.usage_limit ? String(promotion.usage_limit) : "",
      usage_limit_per_user: promotion.usage_limit_per_user ? String(promotion.usage_limit_per_user) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(promotion: Promotion) {
    setMessage("");
    const accepted = await confirm({
      title: "Xoa ma khuyen mai?",
      message: `Ban chac chan muon xoa ma "${promotion.code}"?`,
      confirmLabel: "Xoa",
    });

    if (!accepted) {
      return;
    }

    try {
      await apiDelete(`/admin/promotions/${promotion.id}`);
      setMessage("Da xoa ma khuyen mai.");
      load();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Khong the xoa ma khuyen mai.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Quan ly khuyen mai</h1>

      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-4">
        <Input label="Ma" value={form.code} onChange={(value) => setForm({ ...form, code: value.toUpperCase() })} required />
        <label className="block text-sm font-semibold text-slate-700">
          Kieu giam
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as PromotionForm["type"] })} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal">
            <option value="percent">Phan tram</option>
            <option value="fixed">So tien</option>
          </select>
        </label>
        <Input label={form.type === "percent" ? "Gia tri (%)" : "So tien"} type="number" value={form.value} onChange={(value) => setForm({ ...form, value })} required />
        <Input label="Don toi thieu" type="number" value={form.min_order_amount} onChange={(value) => setForm({ ...form, min_order_amount: value })} />
        <Input label="Giam toi da" type="number" value={form.max_discount_amount} onChange={(value) => setForm({ ...form, max_discount_amount: value })} />
        <Input label="Bat dau" type="datetime-local" value={form.start_at} onChange={(value) => setForm({ ...form, start_at: value })} />
        <Input label="Ket thuc" type="datetime-local" value={form.end_at} onChange={(value) => setForm({ ...form, end_at: value })} />
        <Input label="Tong luot" type="number" value={form.usage_limit} onChange={(value) => setForm({ ...form, usage_limit: value })} />
        <Input label="Luot moi khach" type="number" value={form.usage_limit_per_user} onChange={(value) => setForm({ ...form, usage_limit_per_user: value })} />
        <label className="flex items-center gap-2 pt-7 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
          Dang kich hoat
        </label>
        <div className="flex gap-2 lg:col-span-4">
          <button className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
            {form.id ? "Cap nhat" : "Tao ma"}
          </button>
          {form.id ? (
            <button type="button" onClick={() => setForm(emptyForm)} className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold">
              Huy sua
            </button>
          ) : null}
        </div>
      </form>

      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}

      <div className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-3">Ma</th>
              <th className="p-3">Gia tri</th>
              <th className="p-3">Dieu kien</th>
              <th className="p-3">Luot dung</th>
              <th className="p-3">Trang thai</th>
              <th className="p-3">Thao tac</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promotion) => (
              <tr key={promotion.id} className="border-t border-slate-200">
                <td className="p-3 font-semibold">{promotion.code}</td>
                <td className="p-3">{promotion.type === "percent" ? `${promotion.value}%` : formatVnd(promotion.value)}</td>
                <td className="p-3">
                  <span>Tu {formatVnd(promotion.min_order_amount)}</span>
                  {promotion.max_discount_amount ? <span className="block text-slate-500">Toi da {formatVnd(promotion.max_discount_amount)}</span> : null}
                </td>
                <td className="p-3">
                  {promotion.used_count}/{promotion.usage_limit ?? "khong gioi han"}
                </td>
                <td className="p-3">{promotion.active ? "Active" : "Inactive"}</td>
                <td className="flex gap-2 p-3">
                  <button type="button" onClick={() => edit(promotion)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
                    Sua
                  </button>
                  <button
                    type="button"
                    disabled={(promotion.usages_count ?? 0) > 0}
                    onClick={() => remove(promotion)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Xoa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
        className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950"
      />
    </label>
  );
}

function toPayload(form: PromotionForm) {
  return {
    code: form.code,
    type: form.type,
    value: Number(form.value),
    min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : 0,
    max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : undefined,
    start_at: form.start_at || undefined,
    end_at: form.end_at || undefined,
    active: form.active,
    usage_limit: form.usage_limit ? Number(form.usage_limit) : undefined,
    usage_limit_per_user: form.usage_limit_per_user ? Number(form.usage_limit_per_user) : undefined,
  };
}

function toDatetimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
}
