import Link from "next/link";

import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-950">Dang nhap</h1>
      <p className="mt-2 text-slate-600">Dang nhap de quan ly tai khoan va lich su don hang.</p>
      <div className="mt-6">
        <AuthForm mode="login" />
      </div>
      <p className="mt-4 text-sm text-slate-600">
        Chua co tai khoan?{" "}
        <Link href="/register" className="font-semibold text-teal-700">
          Dang ky
        </Link>
      </p>
    </main>
  );
}
