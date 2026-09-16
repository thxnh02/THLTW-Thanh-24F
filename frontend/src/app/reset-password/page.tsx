"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { apiPost } from "@/lib/api";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md px-4 py-12">Dang tai form dat lai mat khau...</main>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    email: searchParams.get("email") ?? "",
    token: searchParams.get("token") ?? "",
    password: "",
    password_confirmation: "",
  });
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await apiPost("/auth/reset-password", form);
      setMessage("Da dat lai mat khau. Ban co the dang nhap lai.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Khong the dat lai mat khau.");
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-950">Dat lai mat khau</h1>
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <Input label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
        <Input label="Token" value={form.token} onChange={(value) => setForm({ ...form, token: value })} />
        <Input label="Mat khau moi" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
        <Input label="Nhap lai mat khau" type="password" value={form.password_confirmation} onChange={(value) => setForm({ ...form, password_confirmation: value })} />
        {message ? <p className="rounded-md bg-slate-100 p-3 text-sm text-slate-700">{message}</p> : null}
        <button className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Dat lai</button>
      </form>
    </main>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input type={type} required value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 font-normal" />
    </label>
  );
}
