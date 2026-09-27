"use client";

import { FormEvent, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { apiPost } from "@/lib/api";
import { Badge, Button, Input } from "@/components/ui";

export function EmailVerificationPanel({ compact = false }: { compact?: boolean }) {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  if (!user) return null;

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      toast.error("Vui lòng nhập đủ mã xác nhận gồm 6 chữ số.");
      return;
    }

    setVerifying(true);
    try {
      await apiPost(`/auth/email/verify-code`, { code });
      await refreshUser();
      setCode("");
      toast.success("Email đã được xác minh thành công.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể xác minh mã email.");
    } finally {
      setVerifying(false);
    }
  }

  async function resendVerification() {
    setResending(true);
    try {
      await apiPost("/auth/email/verification-notification", {});
      setCode("");
      toast.success("Đã gửi email mới gồm mã xác nhận và link xác minh.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không thể gửi lại email xác nhận.");
    } finally {
      setResending(false);
    }
  }

  if (user.email_verified_at) {
    return (
      <div className={`flex items-center justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 ${compact ? "p-4" : "p-5"}`}>
        <div>
          <p className="text-sm font-bold text-emerald-900">Email đã được xác minh</p>
          <p className="mt-1 text-sm text-emerald-800">{user.email}</p>
        </div>
        <Badge tone="success">Đã xác minh</Badge>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-amber-200 bg-amber-50 ${compact ? "p-4" : "p-5"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-amber-950">Xác minh email</p>
          <p className="mt-1 text-sm leading-6 text-amber-900">Nhập mã 6 số trong email hoặc mở link xác nhận để hoàn tất.</p>
        </div>
        <Badge tone="warning">Chưa xác minh</Badge>
      </div>
      <form onSubmit={verifyCode} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-semibold text-amber-950">
          Mã xác nhận
          <Input
            className="mt-1 border-amber-300 bg-white text-center font-mono text-lg tracking-[0.35em]"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            aria-label="Mã xác nhận email 6 số"
          />
        </label>
        <Button disabled={verifying || code.length !== 6}>{verifying ? "Đang kiểm tra..." : "Xác nhận mã"}</Button>
      </form>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-amber-200 pt-4">
        <p className="text-xs text-amber-900">Email gửi đến: {user.email}</p>
        <Button type="button" variant="secondary" disabled={resending} onClick={() => void resendVerification()}>
          {resending ? "Đang gửi..." : "Gửi lại mã và link"}
        </Button>
      </div>
    </div>
  );
}
