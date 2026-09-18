"use client";

import { FormEvent, useState } from "react";

import { apiPost } from "@/lib/api";
import { Button, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await apiPost("/auth/forgot-password", { email });
      setMessage("Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Không thể gửi yêu cầu.");
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-950">Quên mật khẩu</h1>
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700">
          Email
          <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 font-normal" />
        </label>
        {message ? <p className="rounded-md bg-slate-100 p-3 text-sm text-slate-700">{message}</p> : null}
        <Button>Gửi liên kết</Button>
      </form>
    </main>
  );
}
