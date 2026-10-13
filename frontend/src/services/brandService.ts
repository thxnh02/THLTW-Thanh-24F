import { API_CONFIG } from "@/config/api";
import { requestList } from "@/services/transport";
import type { Brand } from "@/types/api";
export const brandService = { getBrands: () => requestList<Brand>(API_CONFIG.ENDPOINTS.BRANDS.INDEX) };
