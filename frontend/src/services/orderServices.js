import API_CONFIG from "@/config/api";
import axiosAdmin from "@/lib/axiosAdmin";

const endpoints = API_CONFIG.ENDPOINTS.ORDERS;

const orderServices = {
  getOrders: (params) => axiosAdmin.get(endpoints.ADMIN_INDEX, { params }),
  getOrder: (id) => axiosAdmin.get(endpoints.ADMIN_SHOW(id)),
  updateStatus: (id, status) => axiosAdmin.patch(endpoints.ADMIN_STATUS(id), { status }),
};

export default orderServices;
