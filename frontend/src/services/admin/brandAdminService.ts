import { API_CONFIG } from "@/config/api";
import { adminResourceService } from "@/services/admin/adminResourceService";
import type { Brand } from "@/types/api";

export type BrandPayload = {
  name: string;
  slug?: string;
  logo?: string;
  status: "active" | "inactive";
};

const endpointWithQuery = (query = "") => `${API_CONFIG.ENDPOINTS.ADMIN.BRANDS.INDEX}${query ? `?${query}` : ""}`;

export const brandAdminService = {
  getBrands: (query = "") => adminResourceService.paginated<Brand>(endpointWithQuery(query)),
  getAllBrands: () => adminResourceService.allPages<Brand>(API_CONFIG.ENDPOINTS.ADMIN.BRANDS.INDEX),
  getBrand: (id: number | string) => adminResourceService.get<Brand>(API_CONFIG.ENDPOINTS.ADMIN.BRANDS.SHOW(id)),
  createBrand: (payload: BrandPayload) => adminResourceService.create<Brand>(API_CONFIG.ENDPOINTS.ADMIN.BRANDS.STORE, payload),
  updateBrand: (id: number | string, payload: BrandPayload) => adminResourceService.update<Brand>(API_CONFIG.ENDPOINTS.ADMIN.BRANDS.UPDATE(id), payload),
  deleteBrand: (id: number | string) => adminResourceService.remove<null>(API_CONFIG.ENDPOINTS.ADMIN.BRANDS.DELETE(id)),
};
