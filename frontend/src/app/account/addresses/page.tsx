"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Address } from "@/types/api";

type AddressForm = Omit<Address, "id"> & { id?: number };

const emptyForm: AddressForm = {
  recipient_name: "",
  phone: "",
  province: "",
  district: "",
  ward: "",
  address_line: "",
  is_default: false,
};

export default function AccountAddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    apiGet<Address[]>("/account/addresses")
      .then(setAddresses)
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/login");
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
    if (form.id) {
      await apiPatch(`/account/addresses/${form.id}`, form);
      setMessage("Da cap nhat dia chi.");
    } else {
      await apiPost("/account/addresses", form);
      setMessage("Da tao dia chi.");
    }
    setForm(emptyForm);
    load();
  }

  async function remove(address: Address) {
    await apiDelete(`/account/addresses/${address.id}`);
    setMessage("Da xoa dia chi.");
    load();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Dia chi giao hang</h1>
      <form onSubmit={submit} className="mt-6 grid gap-3 rounded-md border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
        <Input label="Nguoi nhan" value={form.recipient_name} onChange={(value) => setForm({ ...form, recipient_name: value })} required />
        <Input label="Dien thoai" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} required />
        <Input label="Tinh/TP" value={form.province ?? ""} onChange={(value) => setForm({ ...form, province: value })} />
        <Input label="Quan/Huyen" value={form.district ?? ""} onChange={(value) => setForm({ ...form, district: value })} />
        <Input label="Phuong/Xa" value={form.ward ?? ""} onChange={(value) => setForm({ ...form, ward: value })} />
        <Input label="Dia chi" value={form.address_line} onChange={(value) => setForm({ ...form, address_line: value })} required />
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={form.is_default} onChange={(event) => setForm({ ...form, is_default: event.target.checked })} />
          Dat lam mac dinh
        </label>
        <button className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white">{form.id ? "Cap nhat" : "Tao dia chi"}</button>
      </form>
      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}
      <div className="mt-6 grid gap-3">
        {addresses.map((address) => (
          <article key={address.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-950">{address.recipient_name} {address.is_default ? "(Mac dinh)" : ""}</h2>
                <p className="text-sm text-slate-600">{address.phone}</p>
                <p className="mt-1 text-sm text-slate-700">{[address.address_line, address.ward, address.district, address.province].filter(Boolean).join(", ")}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm(address)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Sua</button>
                <button type="button" onClick={() => remove(address)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Xoa</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

function Input({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal" />
    </label>
  );
}
