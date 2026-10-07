"use client";

import { FormEvent, useState } from "react";

import { apiPost } from "@/lib/api";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";
import { Button, Input as TextInput, Textarea } from "@/components/ui";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const settings = useStoreSettings();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");

    try {
      await apiPost("/contact", form);
      setFeedback("Đã gửi liên hệ thành công. Chúng tôi sẽ phản hồi sớm.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : "Không thể gửi liên hệ.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-[0.7fr_1.3fr] md:items-start"><div><h1 className="text-3xl font-bold text-slate-950">Liên hệ</h1><p className="mt-2 text-slate-600">Gửi câu hỏi, chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.</p><div className="mt-6 grid gap-2 text-sm text-slate-600">{settings.phone ? <a href={`tel:${settings.phone}`} className="font-semibold text-teal-800">{settings.phone}</a> : null}{settings.email ? <a href={`mailto:${settings.email}`} className="font-semibold text-teal-800">{settings.email}</a> : null}{settings.address ? <span>{settings.address}</span> : null}</div></div><form onSubmit={submit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><Input label="Họ và tên" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
        <Input label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
        <Input label="Điện thoại" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
        <Input label="Chủ đề" value={form.subject} onChange={(value) => setForm({ ...form, subject: value })} required />
        <label className="block text-sm font-semibold text-slate-700">
          Nội dung
          <Textarea
            required
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            className="mt-1 min-h-32 font-normal"
          />
        </label>
        {feedback ? <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">{feedback}</p> : null}
        <Button disabled={submitting}>{submitting ? "Đang gửi..." : "Gửi liên hệ"}</Button>
      </form></div>
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
      <TextInput
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 font-normal"
      />
    </label>
  );
}
