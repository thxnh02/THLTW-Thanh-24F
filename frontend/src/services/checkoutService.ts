import { API_CONFIG } from "@/config/api";
import { create, requestList } from "@/services/transport";
import type { ShippingMethod } from "@/types/api";
export const checkoutService = { getShippingMethods: (subtotal: number) => requestList<ShippingMethod>(`${API_CONFIG.ENDPOINTS.CHECKOUT.SHIPPING_METHODS}?subtotal=${subtotal}`), checkout: <T>(payload: unknown) => create<T>(API_CONFIG.ENDPOINTS.CHECKOUT.CHECKOUT, payload) };
