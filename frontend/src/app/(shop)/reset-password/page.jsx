"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthField, AuthFormShell, AuthNotice, authButtonClass, authErrorMessage, authFieldErrors, authInputClass, PasswordInput } from "@/components/shop/AuthFormShell";
import customerAuthServices from "@/services/customerAuthServices";
import { clearPendingResetEmail, usePendingAuthEmail } from "@/lib/pendingAuthEmail";

export default function ResetPasswordPage() {
  const pendingEmail = usePendingAuthEmail("reset");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setNotice("");
    try {
      await customerAuthServices.resetPassword({
        email: (email || pendingEmail).trim().toLowerCase(),
        code,
        password,
        password_confirmation: passwordConfirmation,
      });
      clearPendingResetEmail();
      setComplete(true);
      setNotice("Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.");
    } catch (error) {
      setErrors(authFieldErrors(error));
      setNotice(authErrorMessage(error, "Không thể đặt lại mật khẩu. Vui lòng kiểm tra mã rồi thử lại."));
    } finally {
      setLoading(false);
    }
  };

  return <AuthFormShell title="Tạo mật khẩu mới" description="Nhập mã 6 chữ số trong email và chọn mật khẩu mới." footer={<>Cần yêu cầu mã khác? <Link className="font-semibold text-[#37665b] hover:underline" href="/forgot-password">Quay lại</Link></>}>
    {complete ? <div className="space-y-4"><AuthNotice tone="success">{notice}</AuthNotice><Link className={`${authButtonClass} w-full`} href="/login">Đi đến đăng nhập</Link></div> : <form className="space-y-4" noValidate onSubmit={submit}>
      <AuthNotice>{notice}</AuthNotice>
      <AuthField error={errors.email?.[0]} id="reset-email" label="Email"><input aria-describedby={errors.email ? "reset-email-error" : undefined} aria-invalid={Boolean(errors.email)} autoComplete="email" className={authInputClass} id="reset-email" maxLength={254} onChange={(event) => setEmail(event.target.value)} required type="email" value={email || pendingEmail} /></AuthField>
      <AuthField error={errors.code?.[0]} id="reset-code" label="Mã đặt lại"><input aria-describedby={errors.code ? "reset-code-error" : undefined} aria-invalid={Boolean(errors.code)} autoComplete="one-time-code" className={`${authInputClass} text-center text-xl font-semibold tracking-[.45em]`} id="reset-code" inputMode="numeric" maxLength={6} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required value={code} /></AuthField>
      <AuthField error={errors.password?.[0]} id="reset-password" label="Mật khẩu mới"><PasswordInput autoComplete="new-password" error={errors.password?.[0]} id="reset-password" onChange={(event) => setPassword(event.target.value)} value={password} /></AuthField>
      <AuthField error={errors.password_confirmation?.[0]} id="reset-password-confirmation" label="Nhập lại mật khẩu mới"><PasswordInput autoComplete="new-password" error={errors.password_confirmation?.[0]} id="reset-password-confirmation" onChange={(event) => setPasswordConfirmation(event.target.value)} value={passwordConfirmation} /></AuthField>
      <p className="text-xs text-slate-500">Mật khẩu cần có ít nhất 8 ký tự. Mã chỉ dùng một lần và hết hạn sau 5 phút.</p>
      <button className={`${authButtonClass} w-full`} disabled={loading} type="submit">{loading ? "Đang cập nhật…" : "Đặt lại mật khẩu"}</button>
    </form>}
  </AuthFormShell>;
}
