import { API_CONFIG } from "@/config/api";
import { create, read, requestList, requestPaginated, requestResponse, update } from "@/services/transport";
import type { Address, CustomerNotification, Order, ReturnRequest } from "@/types/api";
export const accountService = {
  getAddresses: () => requestList<Address>(API_CONFIG.ENDPOINTS.ACCOUNT.ADDRESSES), createAddress: (payload: unknown) => create<Address>(API_CONFIG.ENDPOINTS.ACCOUNT.ADDRESSES, payload), updateAddress: (id: number, payload: unknown) => update<Address>(API_CONFIG.ENDPOINTS.ACCOUNT.ADDRESS(id), payload),
  getOrders: (query = "") => requestPaginated<Order>(`${API_CONFIG.ENDPOINTS.ACCOUNT.ORDERS}${query ? `?${query}` : ""}`), getOrder: (code: string) => read<Order>(API_CONFIG.ENDPOINTS.ACCOUNT.ORDER(code)), cancelOrder: (code: string) => create<Order>(API_CONFIG.ENDPOINTS.ACCOUNT.CANCEL_ORDER(code), {}),
  getReturns: (query = "") => requestPaginated<ReturnRequest>(`${API_CONFIG.ENDPOINTS.ACCOUNT.RETURNS}${query ? `?${query}` : ""}`), getReturn: (code: string) => read<ReturnRequest>(API_CONFIG.ENDPOINTS.ACCOUNT.RETURN(code)), createReturn: (payload: unknown) => create<ReturnRequest>(API_CONFIG.ENDPOINTS.ACCOUNT.RETURNS, payload),
  getNotifications: (query = "") => requestResponse<CustomerNotification[]>(`${API_CONFIG.ENDPOINTS.ACCOUNT.NOTIFICATIONS}${query ? `?${query}` : ""}`), readNotification: (id: number) => create<void>(API_CONFIG.ENDPOINTS.ACCOUNT.READ_NOTIFICATION(id), {}), readAllNotifications: () => create<void>(API_CONFIG.ENDPOINTS.ACCOUNT.READ_ALL_NOTIFICATIONS, {}),
};
