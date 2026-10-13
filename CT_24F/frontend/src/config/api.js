const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api",
  HEADERS: { Accept: "application/json" },
  TIMEOUT: 10000,
  ENDPOINTS: {
    CATEGORIES: {
      INDEX: "/categories", SHOW_BY_SLUG: (slug) => `/categories/${slug}`,
      ADMIN_INDEX: "/admin/categories", ADMIN_SHOW: (id) => `/admin/categories/${id}`,
      ADMIN_STORE: "/admin/categories", ADMIN_UPDATE: (id) => `/admin/categories/${id}`, ADMIN_DELETE: (id) => `/admin/categories/${id}`,
    },
    BRANDS: {
      INDEX: "/brands", ADMIN_INDEX: "/admin/brands", ADMIN_SHOW: (id) => `/admin/brands/${id}`,
      ADMIN_STORE: "/admin/brands", ADMIN_UPDATE: (id) => `/admin/brands/${id}`, ADMIN_DELETE: (id) => `/admin/brands/${id}`,
    },
    PRODUCTS: { INDEX: "/products", ADMIN_STORE: "/admin/products" },
  },
};

export default API_CONFIG;
