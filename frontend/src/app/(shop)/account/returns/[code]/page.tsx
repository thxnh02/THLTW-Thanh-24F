"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError, apiGet } from "@/lib/api";
import type { ReturnRequest } from "@/types/api";
import { Badge, ErrorState, Skeleton } from "@/components/ui";

export default function AccountReturnDetailPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiGet<ReturnRequest>(`/account/returns/${params.code}`)
      .then(setReturnRequest)
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/login");
          return;
        }
        setMessage(reason.message);
      });
  }, [params.code, router]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {message ? <ErrorState title="Không thể tải yêu cầu" message="Yêu cầu không tồn tại hoặc hiện không khả dụng." /> : null}
      {!returnRequest && !message ? <Skeleton className="h-80 w-full" /> : null}
      {returnRequest ? (
        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">{returnRequest.code}</h1>
          <p className="mt-2 text-sm text-slate-600"><Badge tone={returnRequest.status === "completed" ? "success" : returnRequest.status === "rejected" ? "danger" : "brand"}>{returnStatus(returnRequest.status)}</Badge> · {refundStatus(returnRequest.refund_status)}</p>
          <p className="mt-4">{returnRequest.reason}</p>
          <div className="mt-5 space-y-3">
            {returnRequest.items?.map((item) => (
              <div key={item.id} className="rounded-md bg-slate-50 p-3 text-sm">
                <p className="font-semibold">{item.order_item?.product_name}</p>
                <p>Số lượng: {item.quantity}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function returnStatus(status: ReturnRequest["status"]): string { return { requested: "Đã gửi", approved: "Đã duyệt", rejected: "Từ chối", received: "Đã nhận hàng", completed: "Hoàn tất", canceled: "Đã hủy" }[status]; }
function refundStatus(status: ReturnRequest["refund_status"]): string { return { none: "Chưa xử lý", pending: "Đang xử lý", refunded: "Đã hoàn tiền", failed: "Hoàn tiền thất bại" }[status]; }
