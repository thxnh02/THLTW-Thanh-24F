import API_CONFIG from "@/config/api";
import axiosClient from "@/lib/axiosClient";
import axiosAdmin from "@/lib/axiosAdmin";

const productServices = {
  getProducts: (params) => axiosClient.get(API_CONFIG.ENDPOINTS.PRODUCTS.INDEX, { params }),
  getAdminProducts: (params) => axiosAdmin.get(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_INDEX, { params }),
  getAdminProduct: (id) => axiosAdmin.get(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_SHOW(id)),
  createProduct: (data) => axiosAdmin.post(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_STORE, data),
  updateProduct: (id, data) => axiosAdmin.put(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_UPDATE(id), data),
  deleteProduct: (id) => axiosAdmin.delete(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_DELETE(id)),
  getProductTrash: (params) => axiosAdmin.get(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_TRASH, { params }),
  getTrashedProduct: (id) => axiosAdmin.get(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_TRASHED_SHOW(id)),
  restoreProduct: (id) => axiosAdmin.post(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_RESTORE(id)),
  forceDeleteProduct: (id) => axiosAdmin.delete(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_FORCE_DELETE(id)),
};

export default productServices;
