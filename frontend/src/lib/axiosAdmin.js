import axios from 'axios';
import API_CONFIG from '@/config/api';
import { ensureAuthCsrfCookie } from '@/lib/axiosAuth';

// Admin API calls use the same Sanctum session cookie as the login form.
const axiosAdmin = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: API_CONFIG.HEADERS,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true,
  withXSRFToken: true,
});

axiosAdmin.interceptors.request.use(async (config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
    await ensureAuthCsrfCookie();
  }
  return config;
});

axiosAdmin.interceptors.response.use((response) => response, async (error) => {
  const request = error.config;
  if (error.response?.status === 419 && request && !request.__csrfRetried) {
    request.__csrfRetried = true;
    await ensureAuthCsrfCookie();
    return axiosAdmin(request);
  }
  return Promise.reject(error);
});

export default axiosAdmin;
