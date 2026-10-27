import API_CONFIG from "@/config/api";
import axiosClient from "@/lib/axiosClient";
import axiosAdmin from "@/lib/axiosAdmin";

const endpoints = API_CONFIG.ENDPOINTS.POSTS;

const postServices = {
  getPublishedPosts: (params, options = {}) => axiosClient.get(endpoints.INDEX, { params, ...options }),
  getPublishedPost: (slug) => axiosClient.get(endpoints.SHOW_BY_SLUG(slug)),
  getPosts: (params) => axiosAdmin.get(endpoints.ADMIN_INDEX, { params }),
  getPost: (id) => axiosAdmin.get(endpoints.ADMIN_SHOW(id)),
  createPost: (data) => axiosAdmin.post(endpoints.ADMIN_STORE, data),
  updatePost: (id, data) => axiosAdmin.put(endpoints.ADMIN_UPDATE(id), data),
  deletePost: (id) => axiosAdmin.delete(endpoints.ADMIN_DELETE(id)),
  getPostTrash: (params) => axiosAdmin.get(endpoints.ADMIN_TRASH, { params }),
  restorePost: (id) => axiosAdmin.post(endpoints.ADMIN_RESTORE(id)),
  forceDeletePost: (id) => axiosAdmin.delete(endpoints.ADMIN_FORCE_DELETE(id)),
};

export default postServices;
