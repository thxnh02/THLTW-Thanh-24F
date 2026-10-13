import { API_CONFIG } from "@/config/api"; import { adminResourceService } from "@/services/admin/adminResourceService";
export const settingsAdminService = { get: <T>() => adminResourceService.get<T>(API_CONFIG.ENDPOINTS.ADMIN.SETTINGS), update: <T>(payload: unknown) => adminResourceService.replace<T>(API_CONFIG.ENDPOINTS.ADMIN.SETTINGS, payload) };
