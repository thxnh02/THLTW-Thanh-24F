"use client";

import { FormEvent, useState } from "react";

import { apiPost } from "@/lib/api";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");

    try {
      await apiPost("/contact", form);
      setFeedback("Da gui lien he thanh cong.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : "Khong the gui lien he.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Lien he</h1>
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <Input label="Ho ten" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
        <Input label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
        <Input label="Dien thoai" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
        <Input label="Chu de" value={form.subject} onChange={(value) => setForm({ ...form, subject: value })} required />
        <label className="block text-sm font-semibold text-slate-700">
          Noi dung
          <textarea
            required
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            className="mt-1 min-h-32 w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-950"
          />
        </label>
        {feedback ? <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">{feedback}</p> : null}
        <button disabled={submitting} className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300">
          {submitting ? "Dang gui..." : "Gui lien he"}
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
