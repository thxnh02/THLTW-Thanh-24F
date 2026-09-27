"use client";

import { FormEvent, useState } from "react";

import { apiPost } from "@/lib/api";
import { Button, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [message, setMessage] = useState(""); const [sending, setSending] = useState(false); const [sent, setSent] = useState(false);
  async function send(path: string) { setSending(true); setMessage(""); try { await apiPost(path, { email }); setMessage(path.includes("resend") ? "Mã OTP mới đã được gửi nếu email tồn tại." : "Mã OTP đã được gửi nếu email tồn tại. Hãy kiểm tra hộp thư."); setSent(true); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Không thể gửi mã OTP."); } finally { setSending(false); } }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void send("/auth/forgot-password/otp"); }
  return <main className="mx-auto max-w-md px-4 py-12"><h1 className="text-3xl font-bold text-slate-950">Quên mật khẩu</h1><p className="mt-2 text-sm text-slate-600">Nhập email để nhận mã OTP gồm 6 chữ số.</p><form onSubmit={submit} className="mt-6 grid gap-4 rounded-md border border-slate-200 bg-white p-6 shadow-sm"><label className="block text-sm font-semibold text-slate-700">Email<Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 font-normal" /></label>{message ? <p className="rounded-md bg-slate-100 p-3 text-sm text-slate-700">{message}</p> : null}<Button disabled={sending}>{sending ? "Đang gửi..." : "Gửi mã OTP"}</Button>{sent ? <button type="button" disabled={sending} onClick={() => void send("/auth/forgot-password/otp/resend")} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold disabled:opacity-50">Gửi lại mã OTP</button> : null}</form></main>;
}
