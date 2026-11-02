import axios from "axios";
import API_CONFIG from "@/config/api";

const apiOrigin = new URL(API_CONFIG.BASE_URL).origin;

const authClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: API_CONFIG.HEADERS,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true,
  withXSRFToken: true,
});

let csrfRequest = null;

export function ensureAuthCsrfCookie() {
  if (!csrfRequest) {
    csrfRequest = axios.get(`${apiOrigin}/sanctum/csrf-cookie`, {
      headers: API_CONFIG.HEADERS,
      timeout: API_CONFIG.TIMEOUT,
      withCredentials: true,
      withXSRFToken: true,
    }).finally(() => { csrfRequest = null; });
  }

  return csrfRequest;
}

authClient.interceptors.response.use((response) => response, async (error) => {
  const request = error.config;
  const method = request?.method?.toLowerCase();
  const isMutation = ["post", "put", "patch", "delete"].includes(method);
  if (error.response?.status === 419 && isMutation && !request.__csrfRetried) {
    request.__csrfRetried = true;
    await ensureAuthCsrfCookie();
    return authClient(request);
  }

  return Promise.reject(error);
});

export default authClient;
