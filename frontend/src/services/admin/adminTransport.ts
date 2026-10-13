import type { AxiosRequestConfig } from "axios";

import { axiosAdminClient } from "@/lib/axiosAdminClient";
import { toApiError } from "@/lib/apiError";
import { requireCsrf, unwrapEnvelope } from "@/lib/axiosClient";
import type { ApiResponse, PaginatedMeta } from "@/types/api";

type NestedPaginator<T> = { data: T[]; current_page?: number; last_page?: number; per_page?: number; total?: number; from?: number | null; to?: number | null };
const isMutation = (method: string | undefined) => !["get", "head", "options"].includes((method ?? "get").toLowerCase());

async function requestData<T>(config: AxiosRequestConfig): Promise<T> {
  const run = async () => {
    const response = await axiosAdminClient.request<ApiResponse<T>>(config);
    return unwrapEnvelope(response.data, response.status);
  };

  try {
    return isMutation(config.method) ? await requireCsrf(run) : await run();
  } catch (reason) {
    throw toApiError(reason);
  }
}

export async function requestAdminResponse<T>(url: string, config: AxiosRequestConfig = {}): Promise<{ data: T; meta: Record<string, unknown>; message: string }> {
  const run = async () => {
    const response = await axiosAdminClient.request<ApiResponse<T>>({ ...config, url });
    return { data: unwrapEnvelope(response.data, response.status), meta: response.data.meta ?? {}, message: response.data.message };
  };

  try {
    return isMutation(config.method) ? await requireCsrf(run) : await run();
  } catch (reason) {
    throw toApiError(reason);
  }
}

export async function requestAdminList<T>(url: string): Promise<T[]> {
  const data = await requestData<T[] | { data: T[] }>({ url, method: "get" });
  return Array.isArray(data) ? data : data.data;
}

export async function requestAdminPaginated<T>(url: string): Promise<{ data: T[]; meta: PaginatedMeta }> {
  const response = await requestAdminResponse<T[] | NestedPaginator<T>>(url);
  if (Array.isArray(response.data)) return { data: response.data, meta: response.meta as PaginatedMeta };
  const payload = response.data;
  return { data: payload.data, meta: { ...(response.meta as PaginatedMeta), current_page: payload.current_page, last_page: payload.last_page, per_page: payload.per_page, total: payload.total, from: payload.from, to: payload.to } };
}

export async function requestAllAdminPages<T>(url: string): Promise<T[]> {
  const first = await requestAdminPaginated<T>(url);
  const rows = [...first.data];
  for (let page = (first.meta.current_page ?? 1) + 1; page <= (first.meta.last_page ?? 1); page += 1) {
    rows.push(...(await requestAdminPaginated<T>(`${url}${url.includes("?") ? "&" : "?"}page=${page}`)).data);
  }
  return rows;
}

export const readAdmin = <T>(url: string) => requestData<T>({ url, method: "get" });
export const createAdmin = <T>(url: string, data?: unknown) => requestData<T>({ url, data, method: "post" });
export const updateAdmin = <T>(url: string, data?: unknown) => requestData<T>({ url, data, method: "patch" });
export const replaceAdmin = <T>(url: string, data?: unknown) => requestData<T>({ url, data, method: "put" });
export const removeAdmin = <T>(url: string) => requestData<T>({ url, method: "delete" });
