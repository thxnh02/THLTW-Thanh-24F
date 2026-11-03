"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthField, AuthFormShell, AuthNotice, authButtonClass, authErrorMessage, authFieldErrors, authInputClass, PasswordInput } from "@/components/shop/AuthFormShell";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { safeCustomerReturnTo } from "@/lib/customerAuth";
import { clearPendingVerificationEmail, usePendingAuthEmail, useVerificationMailState } from "@/lib/pendingAuthEmail";
import customerAuthServices from "@/services/customerAuthServices";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useCustomerAuth();
  const pendingEmail = usePendingAuthEmail("verify");
  const verificationState = useVerificationMailState();
  const [emailOverride, setEmailOverride] = useState("");
  const email = emailOverride || pendingEmail;
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setNotice("");
    try {
      await customerAuthServices.login({ email: email.trim().toLowerCase(), password });
      clearPendingVerificationEmail();
      await refreshUser();
      const returnTo = new URLSearchParams(window.location.search).get("returnTo");
      router.replace(safeCustomerReturnTo(returnTo));
    } catch (error) {
      setErrors(authFieldErrors(error));
      setNotice(authErrorMessage(error, "Không thể đăng nhập. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  return <AuthFormShell title="Đăng nhập" description="Đăng nhập để sử dụng tài khoản cửa hàng của bạn." footer={<>Chưa có tài khoản? <Link className="font-semibold text-[#37665b] hover:underline" href="/register">Tạo tài khoản</Link></>}>
    <form className="space-y-4" noValidate onSubmit={submit}>
      {verificationState === "verified" && <AuthNotice tone="success">Email đã được xác minh. Bạn có thể đăng nhập.</AuthNotice>}
      <AuthNotice>{notice}</AuthNotice>
      <AuthField error={errors.email?.[0]} id="login-email" label="Email"><input aria-describedby={errors.email ? "login-email-error" : undefined} aria-invalid={Boolean(errors.email)} autoComplete="email" className={authInputClass} id="login-email" maxLength={254} onChange={(event) => setEmailOverride(event.target.value)} required type="email" value={email} /></AuthField>
      <AuthField error={errors.password?.[0]} id="login-password" label="Mật khẩu"><PasswordInput autoComplete="current-password" error={errors.password?.[0]} id="login-password" onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })); }} value={password} /></AuthField>
      <div className="flex justify-end"><Link className="min-h-10 inline-flex items-center text-sm font-medium text-[#37665b] hover:underline" href="/forgot-password">Quên mật khẩu?</Link></div>
      <button className={`${authButtonClass} w-full`} disabled={loading || !email} type="submit">{loading ? "Đang đăng nhập…" : "Đăng nhập"}</button>
    </form>
  </AuthFormShell>;
}
