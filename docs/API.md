# API

Base URL: `/api/v1`

Public:

- `GET /homepage`
- `GET /categories`
- `GET /brands`
- `GET /products`
- `GET /products/{slug}`
- `GET /search?q=iphone`
- `GET /posts`
- `GET /posts/{slug}`
- `GET /post-categories`
- `GET /pages/{slug}`
- `POST /contact`
- `POST /cart/quote`
- `POST /promotions/validate`
- `POST /checkout`
- `GET /vnpay/return`
- `GET /vnpay/ipn`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

Authenticated member:

- `GET /auth/me`
- `POST /auth/logout`
- `PATCH /account/profile`
- `POST /account/change-password`
- `GET /account/addresses`
- `POST /account/addresses`
- `PATCH /account/addresses/{id}`
- `DELETE /account/addresses/{id}`
- `GET /wishlist`
- `POST /wishlist`
- `DELETE /wishlist/{product_id}`
- `POST /products/{product_id}/reviews`
- `GET /cart`
- `POST /cart/items`
- `PATCH /cart/items/{id}`
- `DELETE /cart/items/{id}`
- `POST /cart/merge`
- `GET /account/orders`
- `GET /account/orders/{code}/invoice`
- `GET /account/orders/{code}`
- `POST /account/orders/{code}/cancel`

Admin foundation:

- `GET /admin/dashboard`
- `GET /admin/uploads/images`
- `POST /admin/uploads/images`
- `DELETE /admin/uploads/images?path=uploads/images/...`
- `GET /admin/categories`
- `POST /admin/categories`
- `GET /admin/categories/{id}`
- `PATCH /admin/categories/{id}`
- `DELETE /admin/categories/{id}`
- `GET /admin/brands`
- `POST /admin/brands`
- `GET /admin/brands/{id}`
- `PATCH /admin/brands/{id}`
- `DELETE /admin/brands/{id}`
- `GET /admin/products`
- `GET /admin/products/export`
- `POST /admin/products`
- `GET /admin/products/{id}`
- `PATCH /admin/products/{id}`
- `DELETE /admin/products/{id}`
- `GET /admin/promotions`
- `POST /admin/promotions`
- `GET /admin/promotions/{id}`
- `PATCH /admin/promotions/{id}`
- `DELETE /admin/promotions/{id}`
- `GET /admin/users`
- `POST /admin/users`
- `GET /admin/users/{id}`
- `PATCH /admin/users/{id}`
- `DELETE /admin/users/{id}`
- `GET /admin/post-categories`
- `POST /admin/post-categories`
- `PATCH /admin/post-categories/{id}`
- `DELETE /admin/post-categories/{id}`
- `GET /admin/posts`
- `POST /admin/posts`
- `PATCH /admin/posts/{id}`
- `DELETE /admin/posts/{id}`
- `GET /admin/pages`
- `POST /admin/pages`
- `PATCH /admin/pages/{id}`
- `DELETE /admin/pages/{id}`
- `GET /admin/menus`
- `POST /admin/menus`
- `PATCH /admin/menus/{id}`
- `DELETE /admin/menus/{id}`
- `GET /admin/banners`
- `POST /admin/banners`
- `PATCH /admin/banners/{id}`
- `DELETE /admin/banners/{id}`
- `GET /admin/contacts`
- `PATCH /admin/contacts/{id}`
- `DELETE /admin/contacts/{id}`
- `GET /admin/settings`
- `PUT /admin/settings`
- `GET /admin/stock`
- `POST /admin/stock`
- `GET /admin/stock/movements`
- `GET /admin/orders`
- `GET /admin/orders/export`
- `GET /admin/orders/{id}/invoice`
- `GET /admin/orders/{id}`
- `PATCH /admin/orders/{id}/status`

Authenticated routes use Laravel Sanctum SPA session cookies. Browser clients should call `/sanctum/csrf-cookie`, then send API requests with `credentials: "include"` and the `X-XSRF-TOKEN` header. Admin routes also require an admin account.

Response shape:

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "meta": {}
}
```
