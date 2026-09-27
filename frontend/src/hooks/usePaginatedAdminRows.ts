"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ApiError, apiGetPaginated } from "@/lib/api";
import type { PaginatedMeta } from "@/types/api";

const emptyMeta: PaginatedMeta = { current_page: 1, last_page: 1, total: 0 };

export function usePaginatedAdminRows<T>(path: string) {
  const router = useRouter(); const params = useSearchParams(); const queryString = params.toString(); const [rows, setRows] = useState<T[]>([]); const [meta, setMeta] = useState(emptyMeta); const [message, setMessage] = useState("");
  useEffect(() => { void apiGetPaginated<T>(`${path}${queryString ? `?${queryString}` : ""}`).then(({ data, meta: nextMeta }) => { setRows(data); setMeta(nextMeta); }).catch((reason: Error) => { if (reason instanceof ApiError && reason.status === 401) router.push("/admin/login"); else setMessage(reason.message); }); }, [path, queryString, router]);
  return { rows, meta, message, setMessage, params, queryString, router };
}
