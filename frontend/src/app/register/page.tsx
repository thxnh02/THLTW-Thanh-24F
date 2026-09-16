import Link from "next/link";

import { AuthForm } from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-950">Dang ky</h1>
      <p className="mt-2 text-slate-600">Tao tai khoan thanh vien de mua hang nhanh hon.</p>
      <div className="mt-6">
        <AuthForm mode="register" />
      </div>
      <p className="mt-4 text-sm text-slate-600">
        Da co tai khoan?{" "}
        <Link href="/login" className="font-semibold text-teal-700">
          Dang nhap
        </Link>
      </p>
    </main>
  );
}
