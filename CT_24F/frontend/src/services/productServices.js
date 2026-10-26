import API_CONFIG from "@/config/api";
import axiosClient from "@/lib/axiosClient";
import axiosAdmin from "@/lib/axiosAdmin";
import { catalogFormData } from "@/lib/catalogFormData.mjs";

// Các hàm gọi API sản phẩm: cửa hàng dùng axiosClient, quản trị dùng axiosAdmin.
const productServices = {
  getProducts: (params) => axiosClient.get(API_CONFIG.ENDPOINTS.PRODUCTS.INDEX, { params }),
  // params.page quyết định trang danh sách sản phẩm trong admin.
  getAdminProducts: (params) => axiosAdmin.get(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_INDEX, { params }),
  getAdminProduct: (id) => axiosAdmin.get(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_SHOW(id)),
  // Được save() của trang thêm gọi; gửi POST và đổi sang FormData nếu có ảnh tải lên.
  createProduct: (data) => axiosAdmin.post(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_STORE, catalogFormData(data, "image_file") ?? data),
  // Trang sửa gọi updateProduct theo ID; multipart dùng POST kèm _method=PUT.
  updateProduct: (id, data) => {
    const upload = catalogFormData(data, "image_file", "PUT");
    return upload ? axiosAdmin.post(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_UPDATE(id), upload) : axiosAdmin.put(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_UPDATE(id), data);
  },
  deleteProduct: (id) => axiosAdmin.delete(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_DELETE(id)),
  // Các thao tác của trang thùng rác sản phẩm.
  getProductTrash: (params) => axiosAdmin.get(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_TRASH, { params }),
  getTrashedProduct: (id) => axiosAdmin.get(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_TRASHED_SHOW(id)),
  restoreProduct: (id) => axiosAdmin.post(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_RESTORE(id)),
  forceDeleteProduct: (id) => axiosAdmin.delete(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_FORCE_DELETE(id)),
};

export default productServices;
