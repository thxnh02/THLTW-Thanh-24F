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
# Added Tables / Columns

- `shipping_methods`: configurable checkout shipping choices with fee, free-shipping threshold, estimate and active state.
- `orders`: added `shipping_method_id`, `shipping_method_name`, `shipping_carrier`, `tracking_code`, `shipped_at`, `delivered_at`.
- `return_requests`, `return_request_items`: member/admin return and refund workflow with item quantities and stock restore timestamp.
- `customer_notifications`: member notification center with unread tracking.
- `promotions`: added `applies_to`, `first_order_only`, `free_shipping`, `min_quantity`.
- `promotion_products`, `promotion_categories`, `promotion_brands`: promotion targeting pivots.
