"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Mail, UserRound } from "lucide-react";
import { AuthFormShell, AuthNotice, authButtonClass } from "@/components/shop/AuthFormShell";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

export default function CustomerAccountPage() {
  const router = useRouter();
  const { user, loading, logout } = useCustomerAuth();
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login?returnTo=%2Faccount");
  }, [loading, router, user]);

  const signOut = async () => {
    setLogoutError("");
    try {
      await logout();
      router.replace("/");
    } catch {
      setLogoutError("Không thể đăng xuất lúc này. Vui lòng thử lại.");
    }
  };

  if (loading || !user) {
    return <AuthFormShell title="Tài khoản" description="Đang kiểm tra phiên đăng nhập…"><p aria-live="polite" className="text-sm text-slate-500" role="status">Vui lòng chờ trong giây lát.</p></AuthFormShell>;
  }

  return <AuthFormShell eyebrow="TÀI KHOẢN CT_24F" title="Thông tin tài khoản" description="Thông tin hồ sơ của bạn.">
    <div className="space-y-4">
      {logoutError && <AuthNotice>{logoutError}</AuthNotice>}
      <div className="flex items-start gap-3 rounded-xl border border-[#e1e9e2] bg-[#f8faf8] p-4"><UserRound aria-hidden="true" className="mt-0.5 size-5 text-[#587168]" /><div><p className="text-xs text-slate-500">Họ và tên</p><p className="mt-1 font-medium text-[#19352f]">{user.name}</p></div></div>
      <div className="flex items-start gap-3 rounded-xl border border-[#e1e9e2] bg-[#f8faf8] p-4"><Mail aria-hidden="true" className="mt-0.5 size-5 text-[#587168]" /><div className="min-w-0"><p className="text-xs text-slate-500">Email</p><p className="mt-1 break-all font-medium text-[#19352f]">{user.email}</p><p className={`mt-1 text-xs ${user.email_verified_at ? "text-[#37665b]" : "text-amber-700"}`}>{user.email_verified_at ? "Email đã xác minh" : "Email chưa xác minh"}</p></div></div>
      <button className={`${authButtonClass} w-full gap-2`} onClick={signOut} type="button"><LogOut aria-hidden="true" className="size-4" />Đăng xuất</button>
      <Link className="flex min-h-11 items-center justify-center rounded-xl text-sm font-medium text-[#37665b] hover:underline" href="/products">Tiếp tục xem sản phẩm</Link>
    </div>
  </AuthFormShell>;
}
