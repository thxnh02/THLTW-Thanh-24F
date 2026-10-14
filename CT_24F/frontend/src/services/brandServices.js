import API_CONFIG from "@/config/api";
import axiosAdmin from "@/lib/axiosAdmin";
import axiosClient from "@/lib/axiosClient";

// Storefront reads use axiosClient; admin catalog CRUD, options, and trash use axiosAdmin.
const brandServices = {
  getBrands: () => axiosClient.get(API_CONFIG.ENDPOINTS.BRANDS.INDEX),
  getAdminBrands: (params) => axiosAdmin.get(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_INDEX, { params }),
  getAdminBrand: (id) => axiosAdmin.get(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_SHOW(id)),
  getAdminBrandOptions: () => axiosAdmin.get(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_OPTIONS),
  createBrand: (data) => axiosAdmin.post(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_STORE, data),
  updateBrand: (id, data) => axiosAdmin.put(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_UPDATE(id), data),
  deleteBrand: (id) => axiosAdmin.delete(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_DELETE(id)),
  getBrandTrash: (params) => axiosAdmin.get(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_TRASH, { params }),
  getTrashedBrand: (id) => axiosAdmin.get(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_TRASHED_SHOW(id)),
  restoreBrand: (id) => axiosAdmin.post(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_RESTORE(id)),
  forceDeleteBrand: (id) => axiosAdmin.delete(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_FORCE_DELETE(id)),
};

export default brandServices;
