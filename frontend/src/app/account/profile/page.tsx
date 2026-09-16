"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { apiPatch } from "@/lib/api";
import type { User } from "@/types/api";

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
    setMessage("Da cap nhat ho so.");
  }

  if (!ready || !user) {
    return <main className="mx-auto max-w-7xl px-4 py-12">Dang tai ho so...</main>;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Ho so tai khoan</h1>
      <form key={user.id} onSubmit={submit} className="mt-6 grid gap-4 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700">
          Email
          <input value={user.email} disabled className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 font-normal" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Ho ten
          <input
            name="name"
            required
            defaultValue={user.name}
            className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Dien thoai
          <input
            name="phone"
            defaultValue={user.phone ?? ""}
            className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-slate-950"
          />
        </label>
        {message ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
        <button className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Luu ho so</button>
      </form>
    </main>
  );
}
