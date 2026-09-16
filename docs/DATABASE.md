# Database

Core ecommerce tables:

- `users`, `addresses`
- `categories`, `brands`, `products`, `product_variants`, `product_images`
- `carts`, `cart_items`
- `promotions`, `promotion_usages`
- `orders`, `order_items`, `order_status_histories`, `payments`
- `post_categories`, `posts`, `pages`, `menus`, `banners`
- `contacts`
- `stock_documents`, `stock_document_items`, `inventory_movements`
- `settings`, `wishlists`, `reviews`

Important rules:

- Product price, promotion and stock are recalculated on the backend.
- Order items snapshot product name, variant name, SKU, unit price and subtotal.
- Checkout writes `inventory_movements` and does not allow negative stock.
- Canceled/completed order flows are prepared in schema but not fully implemented in UI yet.
