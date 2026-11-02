import authClient, { ensureAuthCsrfCookie } from '@/lib/axiosAuth';

const adminAuthServices = {
  login: async (credentials) => {
    await ensureAuthCsrfCookie();
    return authClient.post('/admin/login', credentials);
  },
  me: () => authClient.get('/admin/me'),
  logout: async () => {
    await ensureAuthCsrfCookie();
    return authClient.post('/admin/logout');
  },
};

export default adminAuthServices;
