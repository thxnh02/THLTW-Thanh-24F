"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { apiPost } from "@/lib/api";
import { Button, Input as TextInput } from "@/components/ui";

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
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      if (admin && !["admin", "manager", "staff"].includes(user.role)) {
        setError("Tài khoản này không có quyền truy cập khu vực quản trị.");
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

      setMessage(mode === "login" ? "Đăng nhập thành công." : "Đăng ký thành công.");
      router.push(admin ? "/admin" : "/account/profile");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Thao tác thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      {mode === "register" ? (
        <>
          <Input label="Họ và tên" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
          <Input label="Điện thoại" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
        </>
      ) : null}
      <Input label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
      <div className="relative"><Input label="Mật khẩu" type={showPassword ? "text" : "password"} value={form.password} onChange={(value) => setForm({ ...form, password: value })} required /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-7 rounded px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{showPassword ? "Ẩn" : "Hiện"}</button></div>
      {mode === "register" ? (
        <Input
          label="Nhập lại mật khẩu"
          type={showPassword ? "text" : "password"}
          value={form.password_confirmation}
          onChange={(value) => setForm({ ...form, password_confirmation: value })}
          required
        />
      ) : null}
      {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
      <Button disabled={submitting}>{submitting ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}</Button>
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
