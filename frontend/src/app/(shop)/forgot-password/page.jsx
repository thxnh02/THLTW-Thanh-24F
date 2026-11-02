"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthField, AuthFormShell, AuthNotice, authButtonClass, authErrorMessage, authFieldErrors, authInputClass } from "@/components/shop/AuthFormShell";
import customerAuthServices from "@/services/customerAuthServices";
import { setPendingResetEmail, setResetResendAt, useAuthResendTimestamp, usePendingAuthEmail } from "@/lib/pendingAuthEmail";

export default function ForgotPasswordPage() {
  const pendingEmail = usePendingAuthEmail("reset");
  const resendAt = useAuthResendTimestamp("reset");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(0);
  const seconds = Math.max(0, Math.ceil((resendAt - now) / 1000));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const requestCode = async (event) => {
    event?.preventDefault();
    const targetEmail = (email || pendingEmail).trim().toLowerCase();
    setLoading(true);
    setNotice("");
    try {
      await customerAuthServices.forgotPassword({ email: targetEmail });
      setPendingResetEmail(targetEmail);
      setResetResendAt(Date.now() + 60_000);
      setRequested(true);
      setNotice("Nếu email đã đăng ký và có thể nhận thư, mã đặt lại sẽ được gửi. Nếu chưa nhận được, hãy kiểm tra thư rác hoặc thử lại sau.");
    } catch (error) {
      setErrors(authFieldErrors(error));
      setNotice(authErrorMessage(error, "Chưa thể xử lý yêu cầu lúc này."));
    } finally {
      setLoading(false);
    }
  };

  return <AuthFormShell title="Quên mật khẩu" description="Nhập email tài khoản. Nếu email hợp lệ, bạn sẽ nhận mã đặt lại mật khẩu." footer={<>Nhớ mật khẩu? <Link className="font-semibold text-[#37665b] hover:underline" href="/login">Đăng nhập</Link></>}>
    <form className="space-y-4" noValidate onSubmit={requestCode}>
      {notice && <AuthNotice tone={requested ? "success" : "error"}>{notice}</AuthNotice>}
      <AuthField error={errors.email?.[0]} id="forgot-email" label="Email"><input aria-describedby={errors.email ? "forgot-email-error" : undefined} aria-invalid={Boolean(errors.email)} autoComplete="email" className={authInputClass} id="forgot-email" maxLength={254} onChange={(event) => { setEmail(event.target.value); setErrors({}); }} required type="email" value={email || pendingEmail} /></AuthField>
      <button className={`${authButtonClass} w-full`} disabled={loading || (requested && seconds > 0)} type="submit">{loading ? "Đang gửi yêu cầu…" : requested && seconds > 0 ? `Gửi lại sau ${seconds} giây` : requested ? "Gửi lại mã" : "Gửi mã đặt lại"}</button>
      {requested && <Link className="flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold text-[#37665b] hover:underline" href="/reset-password">Nhập mã và tạo mật khẩu mới</Link>}
    </form>
  </AuthFormShell>;
}
