"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiGetList } from "@/lib/api";
import type { ReturnRequest } from "@/types/api";

export default function AccountReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiGetList<ReturnRequest>("/account/returns")
      .then(setReturns)
      .catch((reason: Error) => {
        if (reason instanceof ApiError && reason.status === 401) {
          router.push("/login");
          return;
        }
        setMessage(reason.message);
      });
  }, [router]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950">Yeu cau doi tra</h1>
      {message ? <p className="mt-4 rounded-md bg-white p-3 text-sm text-red-600">{message}</p> : null}
      <div className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-slate-700"><tr><th className="p-3">Ma</th><th className="p-3">Don hang</th><th className="p-3">Trang thai</th><th className="p-3">Hoan tien</th></tr></thead>
          <tbody>
            {returns.map((item) => (
              <tr key={item.id} className="border-t border-slate-200">
                <td className="p-3 font-semibold"><Link href={`/account/returns/${item.code}`}>{item.code}</Link></td>
                <td className="p-3">{item.order?.code}</td>
                <td className="p-3">{item.status}</td>
                <td className="p-3">{item.refund_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
