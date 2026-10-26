import axiosClient from "@/lib/axiosClient";

// Admin requests share the API connection; authentication can be configured here when available.
const axiosAdmin = axiosClient;

export default axiosAdmin;
