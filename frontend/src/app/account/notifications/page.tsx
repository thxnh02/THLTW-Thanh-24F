"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiGetList, apiPost } from "@/lib/api";
import type { CustomerNotification } from "@/types/api";

export default function AccountNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    apiGetList<CustomerNotification>("/account/notifications")
      .then(setNotifications)
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/login");
          return;
        }
        setMessage(reason.message);
      });
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: number) {
    await apiPost(`/account/notifications/${id}/read`, {});
    load();
  }

  async function markAllRead() {
    await apiPost("/account/notifications/read-all", {});
    load();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-950">Thong bao</h1>
        <button type="button" onClick={markAllRead} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">Danh dau tat ca</button>
      </div>
      {message ? <p className="mt-4 rounded-md bg-white p-3 text-sm text-red-600">{message}</p> : null}
      <div className="mt-6 space-y-3">
        {notifications.map((item) => (
          <div key={item.id} className={`rounded-md border border-slate-200 bg-white p-4 shadow-sm ${item.read_at ? "opacity-70" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-950">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{item.message}</p>
              </div>
              <div className="flex gap-2">
                {item.action_url ? <Link href={item.action_url} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Mo</Link> : null}
                {!item.read_at ? <button type="button" onClick={() => markRead(item.id)} className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white">Da doc</button> : null}
              </div>
            </div>
          </div>
        ))}
        {notifications.length === 0 ? <p className="rounded-md bg-white p-4 text-sm text-slate-600">Chua co thong bao.</p> : null}
      </div>
    </main>
  );
}
