const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? apiBaseUrl.replace(/\/api\/v1\/?$/, "");

export const API_CONFIG = {
  BASE_URL: apiBaseUrl,
  BACKEND_URL: backendUrl,
  HEADERS: { Accept: "application/json" },
  TIMEOUT: 15_000,
  ENDPOINTS: {
    AUTH: {
      REGISTER: "/auth/register", LOGIN: "/auth/login", LOGOUT: "/auth/logout", ME: "/auth/me",
      FORGOT_PASSWORD: "/auth/forgot-password", FORGOT_PASSWORD_OTP: "/auth/forgot-password/otp",
      RESEND_PASSWORD_OTP: "/auth/forgot-password/otp/resend", RESET_PASSWORD: "/auth/reset-password",
      VERIFY_EMAIL_CODE: "/auth/email/verify-code", RESEND_EMAIL_VERIFICATION: "/auth/email/verification-notification",
      CHANGE_PASSWORD: "/account/change-password", PROFILE: "/account/profile", EMAIL: "/account/email", AVATAR: "/account/avatar",
    },
    CATALOG: { HOMEPAGE: "/homepage", SETTINGS: "/store-settings", CATEGORIES: "/categories", BRANDS: "/brands", PRODUCTS: "/products", PRODUCT: (slug: string) => `/products/${slug}`, SEARCH: "/search" },
    CATEGORIES: { INDEX: "/categories" },
    BRANDS: { INDEX: "/brands" },
    CONTENT: { POSTS: "/posts", POST: (slug: string) => `/posts/${slug}`, POST_CATEGORIES: "/post-categories", PAGE: (slug: string) => `/pages/${slug}`, CONTACT: "/contact" },
    CART: { QUOTE: "/cart/quote", VALIDATE_PROMOTION: "/promotions/validate", CART: "/cart", ITEMS: "/cart/items", ITEM: (id: number) => `/cart/items/${id}`, MERGE: "/cart/merge" },
    CHECKOUT: { SHIPPING_METHODS: "/shipping-methods", CHECKOUT: "/checkout" },
    ACCOUNT: {
      ADDRESSES: "/account/addresses", ADDRESS: (id: number) => `/account/addresses/${id}`,
      ORDERS: "/account/orders", ORDER: (code: string) => `/account/orders/${code}`, CANCEL_ORDER: (code: string) => `/account/orders/${code}/cancel`,
      RETURNS: "/account/returns", RETURN: (code: string) => `/account/returns/${code}`,
      NOTIFICATIONS: "/account/notifications", READ_NOTIFICATION: (id: number) => `/account/notifications/${id}/read`, READ_ALL_NOTIFICATIONS: "/account/notifications/read-all",
      WISHLIST: "/wishlist", WISHLIST_ITEM: (productId: number) => `/wishlist/${productId}`,
    },
    REVIEWS: { CREATE: (productId: number) => `/products/${productId}/reviews` },
    ADMIN: {
      DASHBOARD: "/admin/dashboard", PRODUCTS: "/admin/products", PRODUCT: (id: number | string) => `/admin/products/${id}`, PRODUCT_EXPORT: "/admin/products/export", PRODUCT_IMPORT: "/admin/products/import", PRODUCT_IMPORT_PREVIEW: "/admin/products/import/preview", PRODUCT_IMPORT_TEMPLATE: "/admin/products/import/template",
      CATEGORIES: { INDEX: "/admin/categories", STORE: "/admin/categories", SHOW: (id: number | string) => `/admin/categories/${id}`, UPDATE: (id: number | string) => `/admin/categories/${id}`, DELETE: (id: number | string) => `/admin/categories/${id}` },
      BRANDS: { INDEX: "/admin/brands", STORE: "/admin/brands", SHOW: (id: number | string) => `/admin/brands/${id}`, UPDATE: (id: number | string) => `/admin/brands/${id}`, DELETE: (id: number | string) => `/admin/brands/${id}` },
      ORDERS: "/admin/orders", ORDER: (id: number | string) => `/admin/orders/${id}`, ORDER_STATUS: (id: number | string) => `/admin/orders/${id}/status`, ORDER_EXPORT: "/admin/orders/export",
      STOCK: "/admin/stock", STOCK_MOVEMENTS: "/admin/stock/movements", PRODUCT_VARIANT_OPTIONS: "/admin/options/product-variants",
      PROMOTIONS: "/admin/promotions", PROMOTION: (id: number | string) => `/admin/promotions/${id}`,
      USERS: "/admin/users", USER: (id: number | string) => `/admin/users/${id}`,
      POSTS: "/admin/posts", POST: (id: number | string) => `/admin/posts/${id}`, POST_CATEGORIES: "/admin/post-categories", POST_CATEGORY: (id: number | string) => `/admin/post-categories/${id}`,
      PAGES: "/admin/pages", PAGE: (id: number | string) => `/admin/pages/${id}`, MENUS: "/admin/menus", MENU: (id: number | string) => `/admin/menus/${id}`,
      BANNERS: "/admin/banners", BANNER: (id: number | string) => `/admin/banners/${id}`, CONTACTS: "/admin/contacts", CONTACT: (id: number | string) => `/admin/contacts/${id}`,
      SHIPPING_METHODS: "/admin/shipping-methods", SHIPPING_METHOD: (id: number | string) => `/admin/shipping-methods/${id}`,
      RETURNS: "/admin/returns", RETURN: (id: number | string) => `/admin/returns/${id}`, RETURN_STATUS: (id: number | string) => `/admin/returns/${id}/status`,
      REPORTS_OVERVIEW: "/admin/reports/overview", REPORTS_EXPORT: "/admin/reports/export", SETTINGS: "/admin/settings",
      UPLOADS: "/admin/uploads/images", UPLOAD: (id: number | string) => `/admin/uploads/images/${id}`,
    },
  },
} as const;
