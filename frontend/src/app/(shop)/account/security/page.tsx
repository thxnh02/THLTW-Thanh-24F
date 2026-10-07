"use client";

import { FormEvent, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { apiPatch, apiPost } from "@/lib/api";
import { Button, Input, SectionCard } from "@/components/ui";

export default function SecurityPage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [password, setPassword] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [email, setEmail] = useState({ email: "", current_password: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [resending, setResending] = useState(false);

  if (!user) return null;

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPassword(true);
    try {
      await apiPost("/account/change-password", password);
      setPassword({ current_password: "", password: "", password_confirmation: "" });
      toast.success("Đã đổi mật khẩu. Phiên đăng nhập đã được làm mới.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể đổi mật khẩu.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function changeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingEmail(true);
    try {
      await apiPatch("/account/email", email);
      setEmail({ email: "", current_password: "" });
      await refreshUser();
      toast.success("Đã đổi email. Hãy xác minh địa chỉ mới trong hộp thư.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể đổi email.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function resendVerification() {
    setResending(true);
    try {
      await apiPost("/auth/email/verification-notification", {});
      toast.success("Đã gửi lại email xác minh.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể gửi email xác minh.");
    } finally {
      setResending(false);
    }
  }

  return <main className="grid gap-6"><SectionCard><h2 className="text-xl font-bold text-slate-950">Đổi mật khẩu</h2><p className="mt-1 text-sm text-slate-600">Mật khẩu mới cần có ít nhất 8 ký tự. Sau khi đổi, các token API sẽ được thu hồi.</p><form onSubmit={changePassword} className="mt-5 grid gap-4 sm:grid-cols-2"><Password label="Mật khẩu hiện tại" value={password.current_password} onChange={(value) => setPassword({ ...password, current_password: value })} /><Password label="Mật khẩu mới" value={password.password} onChange={(value) => setPassword({ ...password, password: value })} minLength={8} /><Password label="Nhập lại mật khẩu mới" value={password.password_confirmation} onChange={(value) => setPassword({ ...password, password_confirmation: value })} /><div className="flex items-end"><Button disabled={savingPassword}>{savingPassword ? "Đang lưu..." : "Đổi mật khẩu"}</Button></div></form></SectionCard><SectionCard><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-950">Email đăng nhập</h2><p className="mt-1 text-sm text-slate-600">Email hiện tại: {user.email}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.email_verified_at ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{user.email_verified_at ? "Đã xác minh" : "Chưa xác minh"}</span></div><form onSubmit={changeEmail} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Email mới<Input type="email" required value={email.email} onChange={(event) => setEmail({ ...email, email: event.target.value })} className="mt-1" /></label><Password label="Mật khẩu hiện tại" value={email.current_password} onChange={(value) => setEmail({ ...email, current_password: value })} /><div className="sm:col-span-2"><Button disabled={savingEmail}>{savingEmail ? "Đang lưu..." : "Đổi email"}</Button></div></form>{!user.email_verified_at ? <Button type="button" variant="secondary" className="mt-4" disabled={resending} onClick={() => void resendVerification()}>{resending ? "Đang gửi..." : "Gửi lại email xác minh"}</Button> : null}</SectionCard></main>;
}

function Password({ label, value, onChange, minLength }: { label: string; value: string; onChange: (value: string) => void; minLength?: number }) {
  const [visible, setVisible] = useState(false);
  return <label className="relative block text-sm font-semibold text-slate-700">{label}<Input type={visible ? "text" : "password"} required minLength={minLength} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 pr-16" /><button type="button" onClick={() => setVisible((current) => !current)} className="absolute right-2 top-7 rounded px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">{visible ? "Ẩn" : "Hiện"}</button></label>;
}
