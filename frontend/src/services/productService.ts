import { API_CONFIG } from "@/config/api";
import { create, read, requestPaginated } from "@/services/transport";
import type { Product } from "@/types/api";
export const productService = {
  getProducts: (query = "") => requestPaginated<Product>(`${API_CONFIG.ENDPOINTS.CATALOG.PRODUCTS}${query ? `?${query}` : ""}`),
  getProduct: (slug: string) => read<Product>(API_CONFIG.ENDPOINTS.CATALOG.PRODUCT(slug)),
  search: (query = "") => requestPaginated<Product>(`${API_CONFIG.ENDPOINTS.CATALOG.SEARCH}${query ? `?${query}` : ""}`),
  submitReview: (productId: number, payload: { rating: number; content?: string }) => create<void>(API_CONFIG.ENDPOINTS.REVIEWS.CREATE(productId), payload),
};
