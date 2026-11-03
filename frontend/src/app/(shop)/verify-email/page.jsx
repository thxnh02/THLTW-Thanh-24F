"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthField, AuthFormShell, AuthNotice, authButtonClass, authErrorMessage, authFieldErrors, authInputClass } from "@/components/shop/AuthFormShell";
import customerAuthServices from "@/services/customerAuthServices";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { maskEmail } from "@/lib/customerAuth";
import { setPendingVerificationEmail, setVerificationResendAt, setVerificationMailState, useAuthResendTimestamp, usePendingAuthEmail, useVerificationMailState } from "@/lib/pendingAuthEmail";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, refreshUser } = useCustomerAuth();
  const pendingEmail = usePendingAuthEmail("verify");
  const resendAt = useAuthResendTimestamp("verify");
  const mailState = useVerificationMailState();
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailOverride, setEmailOverride] = useState("");
  const email = editingEmail ? emailOverride : user?.email || pendingEmail || emailOverride;
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState("error");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [now, setNow] = useState(0);
  const seconds = Math.max(0, Math.ceil((resendAt - now) / 1000));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const verify = async (event) => {
    event.preventDefault();
    setLoading(true);
    setNotice("");
    try {
      await customerAuthServices.verifyEmail({ email: email.trim().toLowerCase(), code });
      setPendingVerificationEmail(email.trim().toLowerCase());
      setVerificationMailState("verified");
      if (user) { await refreshUser(); router.replace('/account/security'); }
      else router.replace('/login');
    } catch (error) {
      setErrors(authFieldErrors(error));
      setNotice(authErrorMessage(error, "Không thể xác minh email. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setNotice("");
    try {
      await customerAuthServices.resendVerification({ email: email.trim().toLowerCase() });
      if (editingEmail) setPendingVerificationEmail(email.trim().toLowerCase());
      setVerificationResendAt(Date.now() + 60_000);
      setVerificationMailState("requested");
      setNotice("Nếu email thuộc tài khoản chưa xác minh, mã mới sẽ được gửi khi dịch vụ email sẵn sàng.");
      setNoticeTone("success");
    } catch (error) {
      setNotice(authErrorMessage(error, "Chưa thể gửi yêu cầu lúc này."));
      setNoticeTone("error");
    } finally {
      setResending(false);
    }
  };

  return <AuthFormShell eyebrow="XÁC MINH EMAIL" title="Nhập mã xác minh" description="Xác minh email là tùy chọn. Mã gồm 6 chữ số, chỉ dùng một lần và hết hạn sau 5 phút." footer={<Link className="font-semibold text-[#37665b] hover:underline" href={user ? '/account' : '/login'}>Để sau</Link>}>
    <form className="space-y-4" noValidate onSubmit={verify}>
      {mailState === "failed" && <AuthNotice>Chưa gửi được email xác minh. Kiểm tra cấu hình email hoặc thử gửi lại mã.</AuthNotice>}
      {notice && <AuthNotice tone={noticeTone}>{notice}</AuthNotice>}
      {editingEmail || (!pendingEmail && !user?.email) ? <AuthField error={errors.email?.[0]} id="verify-email" label="Email"><input aria-describedby={errors.email ? "verify-email-error" : undefined} aria-invalid={Boolean(errors.email)} autoComplete="email" className={authInputClass} id="verify-email" maxLength={254} onChange={(event) => setEmailOverride(event.target.value)} required type="email" value={emailOverride} /></AuthField> : <div className="rounded-xl bg-[#f5f8f5] p-3.5"><p className="text-xs text-slate-500">Mã được gửi đến</p><p className="mt-1 text-sm font-semibold text-[#19352f]">{maskEmail(email)}</p><button className="mt-2 min-h-9 text-xs font-semibold text-[#37665b] underline" onClick={() => { setEmailOverride(email); setEditingEmail(true); }} type="button">Đổi email</button></div>}
      <AuthField error={errors.code?.[0]} id="verify-code" label="Mã gồm 6 chữ số"><input aria-describedby={errors.code ? "verify-code-error" : undefined} aria-invalid={Boolean(errors.code)} autoComplete="one-time-code" className={`${authInputClass} text-center text-xl font-semibold tracking-[.45em]`} id="verify-code" inputMode="numeric" maxLength={6} name="code" onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} pattern="[0-9]{6}" required value={code} /></AuthField>
      <AuthNotice>{!email && !notice ? "Nhập email dùng khi đăng ký để tiếp tục." : ""}</AuthNotice>
      <button className={`${authButtonClass} w-full`} disabled={loading || !email} type="submit">{loading ? "Đang xác minh…" : "Xác minh email"}</button>
      <button className="min-h-11 w-full rounded-xl border border-[#d8e2da] px-4 text-sm font-semibold text-[#37665b] hover:bg-[#f5f8f5] disabled:cursor-wait disabled:opacity-50" disabled={resending || seconds > 0 || !email} onClick={resend} type="button">{resending ? "Đang gửi yêu cầu…" : seconds > 0 ? `Gửi lại mã sau ${seconds} giây` : "Gửi lại mã xác minh"}</button>
      <p className="text-center text-xs leading-5 text-slate-500">Không tìm thấy email? Kiểm tra thư rác. Mã mới sẽ vô hiệu hóa mã cũ.</p>
    </form>
  </AuthFormShell>;
}
