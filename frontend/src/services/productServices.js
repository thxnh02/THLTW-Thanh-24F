import API_CONFIG from "@/config/api";
import axiosClient from "@/lib/axiosClient";

const productServices = { getProducts: (params) => axiosClient.get(API_CONFIG.ENDPOINTS.PRODUCTS.INDEX, { params }) };

export default productServices;
