import { API_CONFIG } from "@/config/api";
import { requestList } from "@/services/transport";
import type { Category } from "@/types/api";
export const categoryService = { getCategories: () => requestList<Category>(API_CONFIG.ENDPOINTS.CATEGORIES.INDEX) };
