import axios from "axios";

import { API_CONFIG } from "@/config/api";
import { ApiError, toApiError } from "@/lib/apiError";

export const axiosClient = axios.create({ baseURL: API_CONFIG.BASE_URL, headers: API_CONFIG.HEADERS, timeout: API_CONFIG.TIMEOUT, withCredentials: true });
const csrfClient = axios.create({ baseURL: API_CONFIG.BACKEND_URL, headers: API_CONFIG.HEADERS, timeout: API_CONFIG.TIMEOUT, withCredentials: true });

axiosClient.interceptors.request.use((config) => {
  if (typeof document !== "undefined") {
    const token = document.cookie.split("; ").find((item) => item.startsWith("XSRF-TOKEN="))?.split("=")[1];
    if (token) config.headers.set("X-XSRF-TOKEN", decodeURIComponent(token));
  }
  return config;
});

let csrfPromise: Promise<void> | null = null;
export async function ensureCsrfCookie(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!csrfPromise) {
    csrfPromise = csrfClient.get("/sanctum/csrf-cookie").then(() => undefined).catch((reason: unknown) => { csrfPromise = null; throw toApiError(reason); });
  }
  await csrfPromise;
}

export async function requireCsrf<T>(request: () => Promise<T>): Promise<T> {
  await ensureCsrfCookie();
  try { return await request(); } catch (reason) { throw toApiError(reason); }
}

export function unwrapEnvelope<T>(payload: { success?: boolean; message?: string; data?: T; errors?: Record<string, string[]> }, status = 200): T {
  if (!payload.success) throw new ApiError(payload.message || "Không thể tải dữ liệu.", status, payload.errors ?? {});
  return payload.data as T;
}
