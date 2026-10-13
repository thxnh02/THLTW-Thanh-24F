import { API_CONFIG } from "@/config/api"; import { adminResourceService } from "@/services/admin/adminResourceService";
export const contentAdminService = { resource: adminResourceService, endpoints: API_CONFIG.ENDPOINTS.ADMIN };
