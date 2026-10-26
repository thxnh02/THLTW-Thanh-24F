import API_CONFIG from "@/config/api";
import axiosAdmin from "@/lib/axiosAdmin";

const endpoints = API_CONFIG.ENDPOINTS.USERS;

const userServices = {
  getUsers: (params) => axiosAdmin.get(endpoints.ADMIN_INDEX, { params }),
  getUser: (id) => axiosAdmin.get(endpoints.ADMIN_SHOW(id)),
  blockUser: (id) => axiosAdmin.patch(endpoints.ADMIN_BLOCK(id)),
  unblockUser: (id) => axiosAdmin.patch(endpoints.ADMIN_UNBLOCK(id)),
};

export default userServices;
