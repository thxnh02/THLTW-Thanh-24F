import { AxiosError } from "axios";

export class ApiError extends Error {
  constructor(message: string, public status: number, public errors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
  }
}

export function toApiError(reason: unknown): ApiError {
  if (reason instanceof ApiError) return reason;
  if (reason instanceof AxiosError) {
    const payload = reason.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
    return new ApiError(payload?.message || reason.message || "Không thể tải dữ liệu.", reason.response?.status ?? 0, payload?.errors ?? {});
  }
  return new ApiError(reason instanceof Error ? reason.message : "Không thể tải dữ liệu.", 0);
}
