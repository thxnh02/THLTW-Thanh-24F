import { API_CONFIG } from "@/config/api";
import { adminResourceService } from "@/services/admin/adminResourceService";
import type { Category } from "@/types/api";

export type CategoryPayload = {
  name: string;
  slug?: string;
  image?: string;
  status: "active" | "inactive";
  sort_order?: number;
};

const endpointWithQuery = (query = "") => `${API_CONFIG.ENDPOINTS.ADMIN.CATEGORIES.INDEX}${query ? `?${query}` : ""}`;

export const categoryAdminService = {
  getCategories: (query = "") => adminResourceService.paginated<Category>(endpointWithQuery(query)),
  getAllCategories: () => adminResourceService.allPages<Category>(API_CONFIG.ENDPOINTS.ADMIN.CATEGORIES.INDEX),
  getCategory: (id: number | string) => adminResourceService.get<Category>(API_CONFIG.ENDPOINTS.ADMIN.CATEGORIES.SHOW(id)),
  createCategory: (payload: CategoryPayload) => adminResourceService.create<Category>(API_CONFIG.ENDPOINTS.ADMIN.CATEGORIES.STORE, payload),
  updateCategory: (id: number | string, payload: CategoryPayload) => adminResourceService.update<Category>(API_CONFIG.ENDPOINTS.ADMIN.CATEGORIES.UPDATE(id), payload),
  deleteCategory: (id: number | string) => adminResourceService.remove<null>(API_CONFIG.ENDPOINTS.ADMIN.CATEGORIES.DELETE(id)),
};
