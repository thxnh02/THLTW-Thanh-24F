import { AuthForm } from "@/components/AuthForm";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-950">Đăng nhập quản trị</h1>
      <p className="mt-2 text-slate-600">Đăng nhập bằng tài khoản có quyền để quản lý cửa hàng.</p>
      <div className="mt-6">
        <AuthForm mode="login" admin />
      </div>
    </main>
  );
}
