import { API_CONFIG } from "@/config/api";
import { create, read, remove, update } from "@/services/transport";
import type { CartQuote } from "@/types/api";
export const cartService = {
  quote: (payload: unknown) => create<CartQuote>(API_CONFIG.ENDPOINTS.CART.QUOTE, payload),
  getCart: () => read<unknown>(API_CONFIG.ENDPOINTS.CART.CART),
  addItem: (payload: unknown) => create<unknown>(API_CONFIG.ENDPOINTS.CART.ITEMS, payload),
  updateItem: (id: number, payload: unknown) => update<unknown>(API_CONFIG.ENDPOINTS.CART.ITEM(id), payload),
  removeItem: (id: number) => remove<void>(API_CONFIG.ENDPOINTS.CART.ITEM(id)),
  merge: (payload: unknown) => create<void>(API_CONFIG.ENDPOINTS.CART.MERGE, payload),
};
