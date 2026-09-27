"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { apiPost } from "@/lib/api";
import { Button, Input as TextInput } from "@/components/ui";

export default function ResetPasswordPage() { return <Suspense fallback={<main className="mx-auto max-w-md px-4 py-12">Đang tải biểu mẫu đặt lại mật khẩu...</main>}><ResetPasswordContent /></Suspense>; }

function ResetPasswordContent() {
  const searchParams = useSearchParams(); const [form, setForm] = useState({ email: searchParams.get("email") ?? "", token: searchParams.get("token") ?? "", password: "", password_confirmation: "" }); const [message, setMessage] = useState(""); const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setMessage(""); try { await apiPost("/auth/reset-password/otp", form); setMessage("Đã đặt lại mật khẩu. Bạn có thể đăng nhập lại."); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Không thể đặt lại mật khẩu."); } finally { setSaving(false); } }
  return <main className="mx-auto max-w-md px-4 py-12"><h1 className="text-3xl font-bold text-slate-950">Đặt lại mật khẩu</h1><form onSubmit={submit} className="mt-6 grid gap-4 rounded-md border border-slate-200 bg-white p-6 shadow-sm"><Input label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} /><Input label="Mã OTP 6 số" inputMode="numeric" maxLength={6} value={form.token} onChange={(value) => setForm({ ...form, token: value.replace(/\D/g, "").slice(0, 6) })} /><Input label="Mật khẩu mới" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} /><Input label="Nhập lại mật khẩu" type="password" value={form.password_confirmation} onChange={(value) => setForm({ ...form, password_confirmation: value })} />{message ? <p className="rounded-md bg-slate-100 p-3 text-sm text-slate-700">{message}</p> : null}<Button disabled={saving}>{saving ? "Đang xử lý..." : "Đặt lại mật khẩu"}</Button></form></main>;
}

function Input({ label, value, onChange, type = "text", inputMode, maxLength }: { label: string; value: string; onChange: (value: string) => void; type?: string; inputMode?: "numeric"; maxLength?: number }) { return <label className="block text-sm font-semibold text-slate-700">{label}<TextInput type={type} inputMode={inputMode} maxLength={maxLength} required value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 font-normal" /></label>; }
