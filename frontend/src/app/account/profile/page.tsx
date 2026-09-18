"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { apiPatch } from "@/lib/api";
import type { User } from "@/types/api";
import { Button, Input } from "@/components/ui";

export default function ProfilePage() {
  const router = useRouter();
  const { user, ready, refreshUser } = useAuth();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (ready && !user) {
      router.push("/login");
    }
  }, [ready, router, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await apiPatch<User>("/account/profile", {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
    });
    await refreshUser();
    setMessage("Đã cập nhật hồ sơ.");
  }

  if (!ready || !user) {
    return <main className="mx-auto max-w-7xl px-4 py-12">Đang tải hồ sơ...</main>;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-950">Hồ sơ tài khoản</h1>
      <form key={user.id} onSubmit={submit} className="mt-6 grid gap-4 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700">
          Email
          <Input value={user.email} disabled className="mt-1 bg-slate-50" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Họ và tên
          <Input
            name="name"
            required
            defaultValue={user.name}
            className="mt-1 font-normal"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Điện thoại
          <Input
            name="phone"
            defaultValue={user.phone ?? ""}
            className="mt-1 font-normal"
          />
        </label>
        {message ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
        <Button>Lưu hồ sơ</Button>
      </form>
    </main>
  );
}
