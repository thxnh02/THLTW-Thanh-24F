import API_CONFIG from "@/config/api";
import axiosAdmin from "@/lib/axiosAdmin";
import axiosClient from "@/lib/axiosClient";
import { catalogFormData } from "@/lib/catalogFormData.mjs";

// Nơi tập trung các lời gọi API danh mục: cửa hàng dùng axiosClient, quản trị dùng axiosAdmin.
const categoryServices = {
  getCategories: () => axiosClient.get(API_CONFIG.ENDPOINTS.CATEGORIES.INDEX),
  getCategoryBySlug: (slug) => axiosClient.get(API_CONFIG.ENDPOINTS.CATEGORIES.SHOW_BY_SLUG(slug)),
  // params.page quyết định trang danh sách danh mục trong admin.
  getAdminCategories: (params) => axiosAdmin.get(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_INDEX, { params }),
  getAdminCategory: (id) => axiosAdmin.get(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_SHOW(id)),
  getAdminCategoryOptions: () => axiosAdmin.get(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_OPTIONS),
  // Trang thêm gọi createCategory; có ảnh tải lên thì gửi FormData.
  createCategory: (data) => axiosAdmin.post(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_STORE, catalogFormData(data, "image_file") ?? data),
  // Trang sửa gọi updateCategory theo ID; multipart dùng POST kèm _method=PUT.
  updateCategory: (id, data) => {
    const upload = catalogFormData(data, "image_file", "PUT");
    return upload ? axiosAdmin.post(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_UPDATE(id), upload) : axiosAdmin.put(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_UPDATE(id), data);
  },
  deleteCategory: (id) => axiosAdmin.delete(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_DELETE(id)),
  // Các thao tác của trang thùng rác danh mục.
  getCategoryTrash: (params) => axiosAdmin.get(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_TRASH, { params }),
  getTrashedCategory: (id) => axiosAdmin.get(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_TRASHED_SHOW(id)),
  restoreCategory: (id) => axiosAdmin.post(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_RESTORE(id)),
  forceDeleteCategory: (id) => axiosAdmin.delete(API_CONFIG.ENDPOINTS.CATEGORIES.ADMIN_FORCE_DELETE(id)),
};

export default categoryServices;
