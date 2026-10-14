import API_CONFIG from "@/config/api";
import axiosAdmin from "@/lib/axiosAdmin";
import axiosClient from "@/lib/axiosClient";

const categoryServices = {
  getCategories: () => axiosClient.get(API_CONFIG.ENDPOINTS.CATEGORIES.INDEX),
  getCategoryBySlug: (slug) => axiosClient.get(API_CONFIG.ENDPOINTS.CATEGORIES.SHOW_BY_SLUG(slug)),
  getAdminCategories: (params) => axiosAdmin.get(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_INDEX, { params }),
  getAdminCategory: (id) => axiosAdmin.get(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_SHOW(id)),
  getAdminCategoryOptions: () => axiosAdmin.get(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_OPTIONS),
  createCategory: (data) => axiosAdmin.post(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_STORE, data),
  updateCategory: (id, data) => axiosAdmin.put(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_UPDATE(id), data),
  deleteCategory: (id) => axiosAdmin.delete(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_DELETE(id)),
  getCategoryTrash: (params) => axiosAdmin.get(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_TRASH, { params }),
  getTrashedCategory: (id) => axiosAdmin.get(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_TRASHED_SHOW(id)),
  restoreCategory: (id) => axiosAdmin.post(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_RESTORE(id)),
  forceDeleteCategory: (id) => axiosAdmin.delete(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_FORCE_DELETE(id)),
};

export default categoryServices;
