"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VnPayReturnPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/payment-result${window.location.search}`);
  }, [router]);

  return <p aria-live="polite" className="mx-auto max-w-xl rounded-2xl border border-[#e3ebe5] bg-white p-6 text-center text-sm text-slate-600" role="status">Đang kiểm tra kết quả thanh toán…</p>;
}
