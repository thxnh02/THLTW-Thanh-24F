# API testing

Base URL: `http://127.0.0.1:8000/api`  
Header: `Accept: application/json`

## Public

- `GET /categories`
- `GET /categories/dien-tu`
- `GET /categories/not-found` → `404`
- `GET /brands`
- `GET /products` → `data`, `links`, `meta`, 12 mục/trang
- `GET /products?page=2`

## Admin category

- `GET /admin/categories?page=1`
- `GET /admin/categories/options`
- `GET /admin/categories/trash?page=1`
- `GET /admin/categories/trash/{id}`
- `POST /admin/categories`
- `GET /admin/categories/{id}`
- `PUT /admin/categories/{id}`
- `DELETE /admin/categories/{id}`
- `POST /admin/categories/{id}/restore`
- `DELETE /admin/categories/{id}/force`

```json
{"name":"Âm thanh","slug":"am-thanh","parent_id":null,"description":"Dữ liệu học CRUD","sort_order":3,"status":true}
```

## Admin brand

- `GET /admin/brands?page=1`
- `GET /admin/brands/options`
- `GET /admin/brands/trash?page=1`
- `GET /admin/brands/trash/{id}`
- `POST /admin/brands`
- `GET /admin/brands/{id}`
- `PUT /admin/brands/{id}`
- `DELETE /admin/brands/{id}`
- `POST /admin/brands/{id}/restore`
- `DELETE /admin/brands/{id}/force`

```json
{"name":"Demo Brand","slug":"demo-brand","description":"Dữ liệu học CRUD","sort_order":4,"status":true}
```

## Admin products

- `GET /admin/products?page=1`
- `GET /admin/products/trash?page=1`
- `GET /admin/products/trash/{id}`
- `POST /admin/products`
- `GET /admin/products/{id}`
- `PUT /admin/products/{id}`
- `DELETE /admin/products/{id}` — chuyển vào thùng rác
- `POST /admin/products/{id}/restore`
- `DELETE /admin/products/{id}/force` — xóa vĩnh viễn sản phẩm đã ở trong thùng rác

Form sản phẩm dùng `/admin/categories/options` và `/admin/brands/options` để nạp lựa chọn không phân trang. Slugs vẫn duy nhất trong cả bản ghi đã xóa mềm. Danh mục/thương hiệu chỉ xóa mềm khi không còn sản phẩm/danh mục con phù hợp; xóa vĩnh viễn bị chặn nếu lịch sử còn tham chiếu. Sản phẩm công khai 12 mục/trang; danh sách admin 10 mục/trang.

Kết quả mong đợi: `200` thành công, `201` tạo mới, `404` không tìm thấy, `422` validate và `409` khi không được xóa vì còn sản phẩm hoặc danh mục con.
