import { API_CONFIG } from "@/config/api"; import { adminResourceService } from "@/services/admin/adminResourceService";
export const reportAdminService = { dashboard: <T>() => adminResourceService.get<T>(API_CONFIG.ENDPOINTS.ADMIN.DASHBOARD), overview: <T>(range: string) => adminResourceService.get<T>(`${API_CONFIG.ENDPOINTS.ADMIN.REPORTS_OVERVIEW}?range=${range}`) };
