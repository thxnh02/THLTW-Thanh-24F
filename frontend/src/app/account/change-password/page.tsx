"use client";

import { FormEvent, useState } from "react";

import { Button, Input } from "@/components/ui";
import { apiPost } from "@/lib/api";

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setMessage(""); setError("");
    try { await apiPost("/account/change-password", form); setForm({ current_password: "", password: "", password_confirmation: "" }); setMessage("Đã đổi mật khẩu thành công."); } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể đổi mật khẩu."); } finally { setSaving(false); }
  }

  return <main className="mx-auto max-w-2xl px-4 py-8"><h2 className="text-2xl font-bold text-slate-950">Đổi mật khẩu</h2><p className="mt-2 text-sm text-slate-600">Sử dụng mật khẩu mới đủ mạnh và không chia sẻ cho người khác.</p><form onSubmit={submit} className="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><label className="text-sm font-semibold text-slate-700">Mật khẩu hiện tại<Input type="password" required value={form.current_password} onChange={(event) => setForm({ ...form, current_password: event.target.value })} className="mt-1" /></label><label className="text-sm font-semibold text-slate-700">Mật khẩu mới<Input type="password" required minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1" /></label><label className="text-sm font-semibold text-slate-700">Nhập lại mật khẩu mới<Input type="password" required value={form.password_confirmation} onChange={(event) => setForm({ ...form, password_confirmation: event.target.value })} className="mt-1" /></label>{error ? <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}{message ? <p aria-live="polite" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}<Button disabled={saving}>{saving ? "Đang lưu..." : "Đổi mật khẩu"}</Button></form></main>;
}
