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
- `POST /admin/categories`
- `GET /admin/categories/{id}`
- `PUT /admin/categories/{id}`
- `DELETE /admin/categories/{id}`

```json
{"name":"Âm thanh","slug":"am-thanh","parent_id":null,"description":"Dữ liệu học CRUD","sort_order":3,"status":true}
```

## Admin brand

- `GET /admin/brands?page=1`
- `POST /admin/brands`
- `GET /admin/brands/{id}`
- `PUT /admin/brands/{id}`
- `DELETE /admin/brands/{id}`

```json
{"name":"Demo Brand","slug":"demo-brand","description":"Dữ liệu học CRUD","sort_order":4,"status":true}
```

Kết quả mong đợi: `200` thành công, `201` tạo mới, `404` không tìm thấy, `422` validate và `409` khi không được xóa vì còn sản phẩm hoặc danh mục con.
