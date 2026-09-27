"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { EmailVerificationPanel } from "@/components/EmailVerificationPanel";
import { useAuth } from "@/contexts/AuthContext";
import { Button, SectionCard, Skeleton } from "@/components/ui";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [ready, setReady] = useState(false);
  const linkVerified = params.get("status") === "success";

  useEffect(() => {
    void refreshUser().finally(() => setReady(true));
  }, [refreshUser]);

  if (!ready) return <main className="mx-auto max-w-2xl px-4 py-12"><Skeleton className="h-96 w-full" /></main>;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-6 text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-teal-700">Bảo vệ tài khoản</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Xác minh email</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Chọn cách thuận tiện nhất: nhập mã 6 số trong email hoặc bấm link xác nhận đã được gửi cho bạn.</p>
      </div>

      {linkVerified || user?.email_verified_at ? (
        <SectionCard className="mb-6 border-emerald-200 bg-emerald-50 text-center">
          <p className="text-4xl font-bold text-emerald-700" aria-hidden="true">✓</p>
          <h2 className="mt-3 text-xl font-bold text-emerald-950">Email đã được xác minh</h2>
          <p className="mt-2 text-sm text-emerald-900">Tài khoản của bạn đã sẵn sàng sử dụng đầy đủ tính năng.</p>
          <Link href="/account/profile" className="mt-5 inline-flex"><Button>Xem hồ sơ</Button></Link>
        </SectionCard>
      ) : user ? (
        <EmailVerificationPanel />
      ) : (
        <SectionCard className="text-center">
          <h2 className="text-xl font-bold text-slate-950">Phiên đăng nhập đã hết hạn</h2>
          <p className="mt-2 text-sm text-slate-600">Hãy đăng nhập lại để nhập mã xác nhận email.</p>
          <Link href="/login" className="mt-5 inline-flex"><Button>Đăng nhập</Button></Link>
        </SectionCard>
      )}
    </main>
  );
}
