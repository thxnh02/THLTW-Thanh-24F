# Features

Implemented in this slice:

- Homepage API-driven banners, categories, products and posts
- Product listing with search, category/brand/price filters, sort and pagination
- Product detail with variants and related products
- Guest cart in localStorage with versioned schema
- Server-side cart quote and promotion validation
- Token auth endpoints for register, login, logout, profile and password changes
- Locked accounts are blocked from login
- Protected admin API routes with admin role middleware
- Member cart stored in backend and guest cart merge after login/register
- COD checkout with transaction, stock check, order item snapshots and inventory movement
- VNPay Sandbox payment URL and signed return/IPN verification
- Authenticated checkout attaches orders to member accounts
- Member address book, wishlist, recently viewed products and purchase-gated reviews
- Promotion usage is recorded during checkout and per-customer limits are enforced by user/email
- Member order history and pending order cancellation with stock restore once
- Admin dashboard metrics
- Admin category CRUD foundation
- Admin brand CRUD with delete guard when products exist
- Admin product CRUD with variants, images, SKU validation and soft delete/inactive behavior for products with transactions
- Admin promotion CRUD with date, usage limit and transaction delete guards
- Admin user CRUD with role/status updates, soft delete and self-lock/self-delete guards
- Admin content CRUD for post categories, posts, pages, menus, banners, contacts and settings
- Admin stock import/export with stock documents and inventory movement history
- Admin image upload/media manager with safe delete, product galleries, banner/post/settings image upload
- Admin order listing/search/filter/detail and status transitions
- Admin order cancel restores stock once and records order status history
- Demo seed data

Pending larger phases:

- Cookie/session SPA Sanctum flow instead of bearer-token storage
- More polished admin layout/sidebar and confirmation modals
