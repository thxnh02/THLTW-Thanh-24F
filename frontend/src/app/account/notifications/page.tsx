"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiGetList, apiPost } from "@/lib/api";
import type { CustomerNotification } from "@/types/api";
import { EmptyState, ErrorState } from "@/components/ui";

export default function AccountNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    apiGetList<CustomerNotification>("/account/notifications")
      .then(setNotifications)
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/login");
          return;
        }
        setMessage("Không thể tải thông báo.");
      }).finally(() => setLoading(false));
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
        <h1 className="text-3xl font-bold text-slate-950">Thông báo</h1>
        <button type="button" onClick={markAllRead} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">Đánh dấu tất cả đã đọc</button>
      </div>
      {message ? <div className="mt-4"><ErrorState message={message} onRetry={load} /></div> : null}
      <div className="mt-6 space-y-3">
        {notifications.map((item) => (
          <div key={item.id} className={`rounded-md border border-slate-200 bg-white p-4 shadow-sm ${item.read_at ? "opacity-70" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-bold text-slate-950">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                <time className="mt-2 block text-xs text-slate-500" dateTime={item.created_at}>{new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</time>
              </div>
              <div className="flex gap-2">
                {item.action_url ? <Link href={item.action_url} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Mở</Link> : null}
                {!item.read_at ? <button type="button" onClick={() => markRead(item.id)} className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white">Đã đọc</button> : null}
              </div>
            </div>
          </div>
        ))}
        {loading ? <p className="rounded-md bg-white p-4 text-sm text-slate-600">Đang tải thông báo...</p> : null}
        {!loading && notifications.length === 0 ? <EmptyState title="Chưa có thông báo" message="Các cập nhật về đơn hàng và yêu cầu đổi trả sẽ hiển thị tại đây." /> : null}
      </div>
    </main>
  );
}
