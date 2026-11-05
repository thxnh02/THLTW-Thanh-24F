import authClient, { ensureAuthCsrfCookie } from '@/lib/axiosAuth';

const mutate = async (method, path, data) => {
  await ensureAuthCsrfCookie();
  return authClient({ method, url: `/account/${path}`, data });
};

const customerAccountServices = {
  profile: () => authClient.get('/account/profile'),
  updateProfile: (data) => mutate('patch', 'profile', data),
  uploadAvatar: (file) => {
    const data = new FormData();
    data.append('avatar', file);
    return mutate('post', 'avatar', data);
  },
  deleteAvatar: () => mutate('delete', 'avatar'),
  changePassword: (data) => mutate('post', 'security/password', data),
  addresses: () => authClient.get('/account/addresses'),
  createAddress: (data) => mutate('post', 'addresses', data),
  updateAddress: (id, data) => mutate('patch', `addresses/${id}`, data),
  deleteAddress: (id) => mutate('delete', `addresses/${id}`),
  setDefaultAddress: (id) => mutate('patch', `addresses/${id}/default`),
  reviewProduct: (productId, data) => mutate('post', `products/${productId}/reviews`, data),
};

export default customerAccountServices;
