import API_CONFIG from "@/config/api";
import axiosAdmin from "@/lib/axiosAdmin";
import axiosClient from "@/lib/axiosClient";
import { catalogFormData } from "@/lib/catalogFormData.mjs";

// Nơi tập trung các lời gọi API thương hiệu: cửa hàng dùng axiosClient, quản trị dùng axiosAdmin.
const brandServices = {
  getBrands: () => axiosClient.get(API_CONFIG.ENDPOINTS.BRANDS.INDEX),
  // params.page quyết định trang danh sách thương hiệu trong admin.
  getAdminBrands: (params) => axiosAdmin.get(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_INDEX, { params }),
  getAdminBrand: (id) => axiosAdmin.get(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_SHOW(id)),
  getAdminBrandOptions: () => axiosAdmin.get(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_OPTIONS),
  // Trang thêm gọi createBrand; có logo tải lên thì gửi FormData.
  createBrand: (data) => axiosAdmin.post(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_STORE, catalogFormData(data, "logo_file") ?? data),
  // Trang sửa gọi updateBrand theo ID; multipart dùng POST kèm _method=PUT.
  updateBrand: (id, data) => {
    const upload = catalogFormData(data, "logo_file", "PUT");
    return upload ? axiosAdmin.post(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_UPDATE(id), upload) : axiosAdmin.put(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_UPDATE(id), data);
  },
  deleteBrand: (id) => axiosAdmin.delete(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_DELETE(id)),
  // Các thao tác của trang thùng rác thương hiệu.
  getBrandTrash: (params) => axiosAdmin.get(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_TRASH, { params }),
  getTrashedBrand: (id) => axiosAdmin.get(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_TRASHED_SHOW(id)),
  restoreBrand: (id) => axiosAdmin.post(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_RESTORE(id)),
  forceDeleteBrand: (id) => axiosAdmin.delete(API_CONFIG.ENDPOINTS.BRANDS.ADMIN_FORCE_DELETE(id)),
};

export default brandServices;
