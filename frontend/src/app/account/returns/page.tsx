"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiGetList } from "@/lib/api";
import type { ReturnRequest } from "@/types/api";
import { Badge, EmptyState, Skeleton } from "@/components/ui";

export default function AccountReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetList<ReturnRequest>("/account/returns")
      .then(setReturns)
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/login");
          return;
        }
        setMessage("Không thể tải yêu cầu đổi trả.");
      }).finally(() => setLoading(false));
  }, [router]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-950">Yêu cầu đổi trả</h1>
      {message ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{message}</p> : null}
      {loading ? <Skeleton className="mt-6 h-52 w-full" /> : returns.length === 0 ? <div className="mt-6"><EmptyState title="Chưa có yêu cầu đổi trả" message="Các yêu cầu đổi trả của bạn sẽ được hiển thị tại đây." /></div> : <div className="mt-6 overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-slate-700"><tr><th className="p-3">Mã yêu cầu</th><th className="p-3">Đơn hàng</th><th className="p-3">Trạng thái</th><th className="p-3">Hoàn tiền</th></tr></thead>
          <tbody>
            {returns.map((item) => (
              <tr key={item.id} className="border-t border-slate-200">
                <td className="p-3 font-semibold"><Link href={`/account/returns/${item.code}`}>{item.code}</Link></td>
                <td className="p-3">{item.order?.code}</td>
                <td className="p-3"><Badge tone={item.status === "completed" ? "success" : item.status === "rejected" ? "danger" : "brand"}>{returnStatus(item.status)}</Badge></td>
                <td className="p-3">{refundStatus(item.refund_status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </main>
  );
}

function returnStatus(status: ReturnRequest["status"]): string { return { requested: "Đã gửi", approved: "Đã duyệt", rejected: "Từ chối", received: "Đã nhận hàng", completed: "Hoàn tất", canceled: "Đã hủy" }[status]; }
function refundStatus(status: ReturnRequest["refund_status"]): string { return { none: "Chưa xử lý", pending: "Đang xử lý", refunded: "Đã hoàn tiền", failed: "Hoàn tiền thất bại" }[status]; }
