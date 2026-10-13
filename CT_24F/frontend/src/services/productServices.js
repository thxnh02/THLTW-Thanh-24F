import API_CONFIG from "@/config/api";
import axiosClient from "@/lib/axiosClient";
import axiosAdmin from "@/lib/axiosAdmin";

const productServices = {
  getProducts: (params) => axiosClient.get(API_CONFIG.ENDPOINTS.PRODUCTS.INDEX, { params }),
  createProduct: (data) => axiosAdmin.post(API_CONFIG.ENDPOINTS.PRODUCTS.ADMIN_STORE, data),
};

export default productServices;
