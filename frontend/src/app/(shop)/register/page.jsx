"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthField, AuthFormShell, AuthNotice, authButtonClass, authErrorMessage, authFieldErrors, authInputClass, PasswordInput } from "@/components/shop/AuthFormShell";
import customerAuthServices from "@/services/customerAuthServices";
import { setPendingVerificationEmail, setVerificationMailState, setVerificationResendAt } from "@/lib/pendingAuthEmail";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setNotice("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setNotice("");
    try {
      const response = await customerAuthServices.register({ ...form, email: form.email.trim().toLowerCase() });
      const email = response.data?.data?.email ?? form.email.trim().toLowerCase();
      setPendingVerificationEmail(email);
      setVerificationMailState(response.data?.data?.verification_email_sent ? "sent" : "failed");
      setVerificationResendAt(Date.now() + 60_000);
      router.push("/verify-email");
    } catch (error) {
      setErrors(authFieldErrors(error));
      setNotice(authErrorMessage(error, "Không thể tạo tài khoản. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  return <AuthFormShell title="Tạo tài khoản" description="Đăng ký bằng email của bạn. Chúng tôi sẽ gửi mã xác minh trước khi cho phép đăng nhập." footer={<>Đã có tài khoản? <Link className="font-semibold text-[#37665b] hover:underline" href="/login">Đăng nhập</Link></>}>
    <form className="space-y-4" noValidate onSubmit={submit}>
      <AuthNotice>{notice}</AuthNotice>
      <AuthField error={errors.name?.[0]} id="register-name" label="Họ và tên"><input aria-describedby={errors.name ? "register-name-error" : undefined} aria-invalid={Boolean(errors.name)} autoComplete="name" className={authInputClass} id="register-name" maxLength={150} name="name" onChange={change("name")} required value={form.name} /></AuthField>
      <AuthField error={errors.email?.[0]} id="register-email" label="Email"><input aria-describedby={errors.email ? "register-email-error" : undefined} aria-invalid={Boolean(errors.email)} autoComplete="email" className={authInputClass} id="register-email" maxLength={254} name="email" onChange={change("email")} required type="email" value={form.email} /></AuthField>
      <AuthField error={errors.password?.[0]} id="register-password" label="Mật khẩu"><PasswordInput autoComplete="new-password" error={errors.password?.[0]} id="register-password" onChange={change("password")} value={form.password} /></AuthField>
      <AuthField error={errors.password_confirmation?.[0]} id="register-password-confirmation" label="Nhập lại mật khẩu"><PasswordInput autoComplete="new-password" error={errors.password_confirmation?.[0]} id="register-password-confirmation" onChange={change("password_confirmation")} value={form.password_confirmation} /></AuthField>
      <p className="text-xs leading-5 text-slate-500">Mật khẩu cần có ít nhất 8 ký tự. Mã xác minh có hiệu lực trong 5 phút.</p>
      <button className={`${authButtonClass} w-full`} disabled={loading} type="submit">{loading ? "Đang tạo tài khoản…" : "Tạo tài khoản"}</button>
    </form>
  </AuthFormShell>;
}
