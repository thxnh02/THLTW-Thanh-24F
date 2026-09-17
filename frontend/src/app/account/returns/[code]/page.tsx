"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError, apiGet } from "@/lib/api";
import type { ReturnRequest } from "@/types/api";

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
      {message ? <p className="rounded-md bg-white p-4 text-red-600">{message}</p> : null}
      {!returnRequest && !message ? <p className="rounded-md bg-white p-4">Dang tai yeu cau...</p> : null}
      {returnRequest ? (
        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">{returnRequest.code}</h1>
          <p className="mt-2 text-sm text-slate-600">{returnRequest.status} - {returnRequest.refund_status}</p>
          <p className="mt-4">{returnRequest.reason}</p>
          <div className="mt-5 space-y-3">
            {returnRequest.items?.map((item) => (
              <div key={item.id} className="rounded-md bg-slate-50 p-3 text-sm">
                <p className="font-semibold">{item.order_item?.product_name}</p>
                <p>SL: {item.quantity}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
