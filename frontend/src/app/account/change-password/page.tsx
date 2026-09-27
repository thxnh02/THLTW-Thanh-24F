"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/account/security"); }, [router]);
  return <main className="mx-auto max-w-2xl px-4 py-12 text-sm text-slate-500">Dang chuyen den bao mat...</main>;
}
