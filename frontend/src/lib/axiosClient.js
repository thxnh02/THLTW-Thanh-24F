import axios from "axios";
import API_CONFIG from "@/config/api";

const axiosClient = axios.create({ baseURL: API_CONFIG.BASE_URL, headers: API_CONFIG.HEADERS, timeout: API_CONFIG.TIMEOUT });
axiosClient.interceptors.response.use((response) => response, (error) => Promise.reject(error));

export default axiosClient;
