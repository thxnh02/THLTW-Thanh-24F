import API_CONFIG from "@/config/api";
import axiosAdmin from "@/lib/axiosAdmin";

const endpoints = API_CONFIG.ENDPOINTS.ORDERS;

const orderServices = {
  getOrders: (params) => axiosAdmin.get(endpoints.ADMIN_INDEX, { params }),
  getOrder: (id) => axiosAdmin.get(endpoints.ADMIN_SHOW(id)),
  updateStatus: (id, status) => axiosAdmin.patch(endpoints.ADMIN_STATUS(id), { status }),
  reconcile: (id, attempt_id) => axiosAdmin.post(endpoints.ADMIN_RECONCILE(id), { attempt_id }),
  closeUnpaid: (id, reason) => axiosAdmin.post(endpoints.ADMIN_CLOSE_UNPAID(id), { reason }),
  exportCsv: (params) => axiosAdmin.get(endpoints.ADMIN_EXPORT_CSV, { params, responseType: 'blob' }),
  orderPdf: (id) => axiosAdmin.get(endpoints.ADMIN_EXPORT_PDF(id), { responseType: 'blob' }),
};

export default orderServices;
