import API_CONFIG from "@/config/api";
import axiosAdmin from "@/lib/axiosAdmin";
import axiosClient from "@/lib/axiosClient";

const brandServices = {
  getBrands: () => axiosClient.get(API_CONFIG.ENDPOINTS.BRANDS.INDEX),
  getAdminBrands: (params) => axiosAdmin.get(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_INDEX, { params }),
  getAdminBrand: (id) => axiosAdmin.get(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_SHOW(id)),
  createBrand: (data) => axiosAdmin.post(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_STORE, data),
  updateBrand: (id, data) => axiosAdmin.put(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_UPDATE(id), data),
  deleteBrand: (id) => axiosAdmin.delete(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_DELETE(id)),
};

export default brandServices;
