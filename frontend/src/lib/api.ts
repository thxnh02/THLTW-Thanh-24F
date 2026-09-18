import type { ApiResponse } from "@/types/api";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const SANCTUM_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: authHeaders(),
    cache: "no-store",
    credentials: "include",
  });

  return parseResponse<T>(response);
}

export async function apiGetResponse<T>(path: string): Promise<{ data: T; meta: Record<string, unknown> }> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: authHeaders(),
    cache: "no-store",
    credentials: "include",
  });
  const json = await parseEnvelope<T>(response);
  return { data: json.data, meta: json.meta ?? {} };
}

export async function apiGetList<T>(path: string): Promise<T[]> {
  const payload = await apiGet<T[] | { data: T[] }>(path);

  return Array.isArray(payload) ? payload : payload.data;
}

export async function apiPost<T>(
  path: string,
  payload: unknown,
): Promise<T> {
  await ensureCsrfCookie();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
    credentials: "include",
  });

  return parseResponse<T>(response);
}

export async function apiPatch<T>(
  path: string,
  payload: unknown,
): Promise<T> {
  await ensureCsrfCookie();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
    credentials: "include",
  });

  return parseResponse<T>(response);
}

export async function apiPut<T>(
  path: string,
  payload: unknown,
): Promise<T> {
  await ensureCsrfCookie();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
    credentials: "include",
  });

  return parseResponse<T>(response);
}

export async function apiDelete<T>(path: string): Promise<T> {
  await ensureCsrfCookie();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: authHeaders(),
    credentials: "include",
  });

  return parseResponse<T>(response);
}

export async function apiUploadImage(file: File, directory?: string): Promise<{
  path: string;
  url: string;
  mime: string;
  size: number;
}> {
  await ensureCsrfCookie();

  const formData = new FormData();
  formData.append("image", file);

  if (directory) {
    formData.append("directory", directory);
  }

  const response = await fetch(`${API_BASE_URL}/admin/uploads/images`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
    credentials: "include",
  });

  return parseResponse(response);
}

export async function apiUploadForm<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  await ensureCsrfCookie();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
    credentials: "include",
  });

  return parseResponse<T>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const json = await parseEnvelope<T>(response);

  return json.data;
}

async function parseEnvelope<T>(response: Response): Promise<ApiResponse<T> & { errors?: Record<string, string[]> }> {
  const json = (await response.json()) as ApiResponse<T> & {
    errors?: Record<string, string[]>;
  };

  if (!response.ok || !json.success) {
    throw new ApiError(json.message || "Không thể tải dữ liệu.", response.status);
  }

  return json;
}

function authHeaders(extra: Record<string, string> = {}): HeadersInit {
  const xsrfToken = typeof window === "undefined" ? null : getCookie("XSRF-TOKEN");

  return {
    Accept: "application/json",
    ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
    ...extra,
  };
}

let csrfPromise: Promise<void> | null = null;

async function ensureCsrfCookie(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  if (!csrfPromise) {
    csrfPromise = fetch(`${SANCTUM_BASE_URL}/sanctum/csrf-cookie`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    }).then((response) => {
      if (!response.ok) {
        throw new ApiError("Không thể khởi tạo phiên bảo mật.", response.status);
      }
    }).catch((error) => {
      csrfPromise = null;
      throw error;
    });
  }

  await csrfPromise;
}

function getCookie(name: string): string | null {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];

  return value ? decodeURIComponent(value) : null;
}
