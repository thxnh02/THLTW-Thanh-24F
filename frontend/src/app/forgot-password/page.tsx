"use client";

import { FormEvent, useState } from "react";

import { apiPost } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await apiPost("/auth/forgot-password", { email });
      setMessage("Neu email ton tai, lien ket dat lai mat khau da duoc gui.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Khong the gui yeu cau.");
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-950">Quen mat khau</h1>
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700">
          Email
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 font-normal" />
        </label>
        {message ? <p className="rounded-md bg-slate-100 p-3 text-sm text-slate-700">{message}</p> : null}
        <button className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Gui lien ket</button>
      </form>
    </main>
  );
}
