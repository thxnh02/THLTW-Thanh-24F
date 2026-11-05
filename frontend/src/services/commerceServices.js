import authClient, { ensureAuthCsrfCookie } from '@/lib/axiosAuth';

const change = async (method, url, data) => {
  await ensureAuthCsrfCookie();
  return authClient({ method, url, data });
};

const commerceServices = {
  cart: () => authClient.get('/account/cart'),
  add: (product_id, quantity = 1) => change('post', '/account/cart/items', { product_id, quantity }),
  update: (productId, quantity) => change('patch', `/account/cart/items/${productId}`, { quantity }),
  remove: (productId) => change('delete', `/account/cart/items/${productId}`),
  clear: () => change('delete', '/account/cart'),
  merge: (items) => change('post', '/account/cart/merge', { items }),
  checkout: (data) => change('post', '/account/orders', data),
  previewCoupon: (data) => change('post', '/account/coupons/preview', data),
  orders: (page = 1) => authClient.get('/account/orders', { params: { page } }),
  order: (id) => authClient.get(`/account/orders/${id}`),
  orderPdf: (id) => authClient.get(`/account/orders/${id}/export/pdf`, { responseType: 'blob' }),
  retry: (id) => change('post', `/account/orders/${id}/retry-payment`),
  returnStatus: (search) => authClient.get(`/payments/vnpay/return${search}`),
  cancel: (id) => change('post', `/account/orders/${id}/cancel`),
  notifications: (page = 1) => authClient.get('/account/notifications', { params: { page } }),
  readNotification: (id) => change('patch', `/account/notifications/${id}/read`),
};

export default commerceServices;
