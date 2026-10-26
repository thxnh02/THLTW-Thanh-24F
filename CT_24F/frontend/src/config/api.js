const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api",
  HEADERS: { Accept: "application/json" },
  TIMEOUT: 10000,
  ENDPOINTS: {
    CATEGORIES: {
      INDEX: "/categories", SHOW_BY_SLUG: (slug) => `/categories/${slug}`,
      ADMIN_INDEX: "/admin/categories", ADMIN_SHOW: (id) => `/admin/categories/${id}`,
      ADMIN_STORE: "/admin/categories", ADMIN_UPDATE: (id) => `/admin/categories/${id}`, ADMIN_DELETE: (id) => `/admin/categories/${id}`,
      ADMIN_TRASH: "/admin/categories/trash", ADMIN_TRASHED_SHOW: (id) => `/admin/categories/trash/${id}`,
      ADMIN_RESTORE: (id) => `/admin/categories/${id}/restore`, ADMIN_FORCE_DELETE: (id) => `/admin/categories/${id}/force`,
      ADMIN_OPTIONS: "/admin/categories/options",
    },
    BRANDS: {
      INDEX: "/brands", ADMIN_INDEX: "/admin/brands", ADMIN_SHOW: (id) => `/admin/brands/${id}`,
      ADMIN_STORE: "/admin/brands", ADMIN_UPDATE: (id) => `/admin/brands/${id}`, ADMIN_DELETE: (id) => `/admin/brands/${id}`,
      ADMIN_TRASH: "/admin/brands/trash", ADMIN_TRASHED_SHOW: (id) => `/admin/brands/trash/${id}`,
      ADMIN_RESTORE: (id) => `/admin/brands/${id}/restore`, ADMIN_FORCE_DELETE: (id) => `/admin/brands/${id}/force`,
      ADMIN_OPTIONS: "/admin/brands/options",
    },
    PRODUCTS: {
      INDEX: "/products", ADMIN_INDEX: "/admin/products", ADMIN_SHOW: (id) => `/admin/products/${id}`,
      ADMIN_STORE: "/admin/products", ADMIN_UPDATE: (id) => `/admin/products/${id}`, ADMIN_DELETE: (id) => `/admin/products/${id}`,
      ADMIN_TRASH: "/admin/products/trash", ADMIN_TRASHED_SHOW: (id) => `/admin/products/trash/${id}`,
      ADMIN_RESTORE: (id) => `/admin/products/${id}/restore`, ADMIN_FORCE_DELETE: (id) => `/admin/products/${id}/force`,
    },
    USERS: {
      ADMIN_INDEX: "/admin/users", ADMIN_SHOW: (id) => `/admin/users/${id}`,
      ADMIN_BLOCK: (id) => `/admin/users/${id}/block`, ADMIN_UNBLOCK: (id) => `/admin/users/${id}/unblock`,
    },
    ORDERS: {
      ADMIN_INDEX: "/admin/orders", ADMIN_SHOW: (id) => `/admin/orders/${id}`,
      ADMIN_STATUS: (id) => `/admin/orders/${id}/status`,
    },
    POSTS: {
      INDEX: "/posts", SHOW_BY_SLUG: (slug) => `/posts/${encodeURIComponent(slug)}`,
      ADMIN_INDEX: "/admin/posts", ADMIN_SHOW: (id) => `/admin/posts/${id}`,
      ADMIN_STORE: "/admin/posts", ADMIN_UPDATE: (id) => `/admin/posts/${id}`, ADMIN_DELETE: (id) => `/admin/posts/${id}`,
      ADMIN_TRASH: "/admin/posts/trash", ADMIN_RESTORE: (id) => `/admin/posts/${id}/restore`,
      ADMIN_FORCE_DELETE: (id) => `/admin/posts/${id}/force`,
    },
  },
};

export default API_CONFIG;
