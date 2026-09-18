"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { Button, SectionCard } from "@/components/ui";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const { refreshUser } = useAuth();
  const [ready, setReady] = useState(false);
  const success = params.get("status") === "success";

  useEffect(() => {
    void refreshUser().finally(() => setReady(true));
  }, [refreshUser]);

  return <main className="mx-auto max-w-xl px-4 py-16"><SectionCard className="text-center"><p className="text-4xl" aria-hidden="true">{success ? "✓" : "!"}</p><h1 className="mt-4 text-2xl font-bold text-slate-950">{success ? "Email đã được xác minh" : "Xác minh email"}</h1><p className="mt-2 text-sm text-slate-600">{success ? "Bạn có thể tiếp tục sử dụng đầy đủ các tính năng tài khoản." : "Liên kết xác minh không hợp lệ hoặc đã hết hạn. Hãy gửi lại email từ trang bảo mật."}</p>{!ready ? <p className="mt-4 text-xs text-slate-500">Đang cập nhật tài khoản...</p> : null}<div className="mt-6 flex justify-center gap-3"><Link href="/account/profile"><Button>Xem hồ sơ</Button></Link><Link href="/account/security"><Button variant="secondary">Mở bảo mật</Button></Link></div></SectionCard></main>;
}
