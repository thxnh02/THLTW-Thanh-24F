import type { AxiosRequestConfig } from "axios";

import { axiosClient, requireCsrf, unwrapEnvelope } from "@/lib/axiosClient";
import { toApiError } from "@/lib/apiError";
import type { ApiResponse, PaginatedMeta } from "@/types/api";

type NestedPaginator<T> = { data: T[]; current_page?: number; last_page?: number; per_page?: number; total?: number; from?: number | null; to?: number | null };
const isMutation = (method: string | undefined) => !["get", "head", "options"].includes((method ?? "get").toLowerCase());

export async function requestData<T>(config: AxiosRequestConfig): Promise<T> {
  const run = async () => {
    const response = await axiosClient.request<ApiResponse<T>>(config);
    return unwrapEnvelope(response.data, response.status);
  };
  try { return isMutation(config.method) ? await requireCsrf(run) : await run(); } catch (reason) { throw toApiError(reason); }
}

export async function requestResponse<T>(url: string, config: AxiosRequestConfig = {}): Promise<{ data: T; meta: Record<string, unknown>; message: string }> {
  const run = async () => {
    const response = await axiosClient.request<ApiResponse<T>>({ ...config, url });
    const data = unwrapEnvelope(response.data, response.status);
    return { data, meta: response.data.meta ?? {}, message: response.data.message };
  };
  try { return isMutation(config.method) ? await requireCsrf(run) : await run(); } catch (reason) { throw toApiError(reason); }
}

export async function requestList<T>(url: string, config: AxiosRequestConfig = {}): Promise<T[]> {
  const data = await requestData<T[] | { data: T[] }>({ ...config, url });
  return Array.isArray(data) ? data : data.data;
}

export async function requestPaginated<T>(url: string): Promise<{ data: T[]; meta: PaginatedMeta }> {
  const response = await requestResponse<T[] | NestedPaginator<T>>(url);
  if (Array.isArray(response.data)) return { data: response.data, meta: response.meta as PaginatedMeta };
  const payload = response.data;
  return { data: payload.data, meta: { ...(response.meta as PaginatedMeta), current_page: payload.current_page, last_page: payload.last_page, per_page: payload.per_page, total: payload.total, from: payload.from, to: payload.to } };
}

export async function requestAllPages<T>(url: string): Promise<T[]> {
  const first = await requestPaginated<T>(url);
  const rows = [...first.data];
  for (let page = (first.meta.current_page ?? 1) + 1; page <= (first.meta.last_page ?? 1); page += 1) rows.push(...(await requestPaginated<T>(`${url}${url.includes("?") ? "&" : "?"}page=${page}`)).data);
  return rows;
}

export const read = <T>(url: string, config?: AxiosRequestConfig) => requestData<T>({ ...config, url, method: "get" });
export const create = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => requestData<T>({ ...config, url, data, method: "post" });
export const update = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => requestData<T>({ ...config, url, data, method: "patch" });
export const replace = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => requestData<T>({ ...config, url, data, method: "put" });
export const remove = <T>(url: string, config?: AxiosRequestConfig) => requestData<T>({ ...config, url, method: "delete" });
