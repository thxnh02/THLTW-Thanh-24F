"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { apiPost } from "@/lib/api";

type AuthFormProps = {
  mode: "login" | "register";
  admin?: boolean;
};

export function AuthForm({ mode, admin = false }: AuthFormProps) {
  const router = useRouter();
  const { login, register } = useAuth();
  const { items, clearCart } = useCart();
  const [form, setForm] = useState({
    name: "",
    email: admin ? "admin@example.com" : "",
    phone: "",
    password: admin ? "Admin@123" : "",
    password_confirmation: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const user =
        mode === "login"
          ? await login(form.email, form.password)
          : await register({
              name: form.name,
              email: form.email,
              phone: form.phone || undefined,
              password: form.password,
              password_confirmation: form.password_confirmation,
            });

      if (admin && user.role !== "admin") {
        setError("Tai khoan nay khong co quyen admin.");
        return;
      }

      if (!admin && items.length > 0) {
        await apiPost("/cart/merge", {
          items: items.map((item) => ({
            variant_id: item.variantId,
            quantity: item.quantity,
          })),
        });
        clearCart();
      }

      setMessage(mode === "login" ? "Dang nhap thanh cong." : "Dang ky thanh cong.");
      router.push(admin ? "/admin" : "/account/profile");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Thao tac that bai.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      {mode === "register" ? (
        <>
          <Input label="Ho ten" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
          <Input label="Dien thoai" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
        </>
      ) : null}
      <Input label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
      <Input label="Mat khau" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} required />
      {mode === "register" ? (
        <Input
          label="Nhap lai mat khau"
          type="password"
          value={form.password_confirmation}
          onChange={(value) => setForm({ ...form, password_confirmation: value })}
          required
        />
      ) : null}
      {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
      <button disabled={submitting} className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300">
        {submitting ? "Dang xu ly..." : mode === "login" ? "Dang nhap" : "Dang ky"}
      </button>
    </form>
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
