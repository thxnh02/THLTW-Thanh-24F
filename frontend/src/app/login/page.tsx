import Link from "next/link";

import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-950">Đăng nhập</h1>
      <p className="mt-2 text-slate-600">Đăng nhập để quản lý tài khoản và theo dõi đơn hàng.</p>
      <div className="mt-6">
        <AuthForm mode="login" />
      </div>
      <Link href="/forgot-password" className="mt-4 block text-sm font-semibold text-teal-800">Quên mật khẩu?</Link>
      <p className="mt-4 text-sm text-slate-600">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-semibold text-teal-700">
          Đăng ký
        </Link>
      </p>
    </main>
  );
}
