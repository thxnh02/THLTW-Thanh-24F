import { createAdmin, readAdmin, removeAdmin, replaceAdmin, requestAdminList, requestAdminPaginated, requestAdminResponse, requestAllAdminPages, updateAdmin } from "@/services/admin/adminTransport";

export const adminResourceService = {
  get: <T>(endpoint: string) => readAdmin<T>(endpoint), list: <T>(endpoint: string) => requestAdminList<T>(endpoint), paginated: <T>(endpoint: string) => requestAdminPaginated<T>(endpoint), allPages: <T>(endpoint: string) => requestAllAdminPages<T>(endpoint),
  create: <T>(endpoint: string, payload: unknown) => createAdmin<T>(endpoint, payload), update: <T>(endpoint: string, payload: unknown) => updateAdmin<T>(endpoint, payload), replace: <T>(endpoint: string, payload: unknown) => replaceAdmin<T>(endpoint, payload), remove: <T>(endpoint: string) => removeAdmin<T>(endpoint), response: <T>(endpoint: string) => requestAdminResponse<T>(endpoint), removeResponse: <T>(endpoint: string) => requestAdminResponse<T>(endpoint, { method: "delete" }),
};
