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
- `GET /catalog-images/{id}` → nội dung ảnh lưu trong database

## Admin category

- `GET /admin/categories?page=1`
- `POST /admin/categories`
- `GET /admin/categories/{id}`
- `PUT /admin/categories/{id}`
- `DELETE /admin/categories/{id}`
- `GET /admin/categories/trash?page=1`
- `POST /admin/categories/{id}/restore`
- `DELETE /admin/categories/{id}/force`

```json
{"name":"Âm thanh","slug":"am-thanh","parent_id":null,"description":"Thiết bị âm thanh","sort_order":3,"status":true}
```

## Admin brand

- `GET /admin/brands?page=1`
- `POST /admin/brands`
- `GET /admin/brands/{id}`
- `PUT /admin/brands/{id}`
- `DELETE /admin/brands/{id}`
- `GET /admin/brands/trash?page=1`
- `POST /admin/brands/{id}/restore`
- `DELETE /admin/brands/{id}/force`

```json
{"name":"SoundTech","slug":"soundtech","description":"Thiết bị âm thanh và phụ kiện","sort_order":4,"status":true}
```

## Admin product

- `GET /admin/products?page=1`
- `POST /admin/products`
- `GET /admin/products/{id}`
- `PUT /admin/products/{id}`
- `DELETE /admin/products/{id}`
- `GET /admin/products/trash?page=1`
- `POST /admin/products/{id}/restore`
- `DELETE /admin/products/{id}/force`

```json
{"name":"Tai nghe không dây","slug":"tai-nghe-khong-day","category_id":1,"brand_id":null,"price":790000,"sale_price":690000,"status":true}
```

Tên sản phẩm, danh mục và thương hiệu không được trùng trong cùng bảng (không phân biệt chữ hoa/thường, kể cả bản ghi trong thùng rác); API trả `422` tại `errors.name`. Các tên khác nhau vẫn có thể yêu cầu cùng một slug; API tự thêm hậu tố `-2`, `-3`. `sale_price` không bắt buộc, có thể là `null`, và khi có giá trị phải thấp hơn `price`.

Kết quả mong đợi: `200` thành công, `201` tạo mới, `404` không tìm thấy, `422` dữ liệu không hợp lệ và `409` khi bản ghi còn dữ liệu liên quan hoặc chưa đủ điều kiện khôi phục.

## Tải ảnh lên

Form thêm/sửa gửi `multipart/form-data` tới API quản trị hiện có. Trường tệp là `image_file` cho sản phẩm/danh mục và `logo_file` cho thương hiệu. Chấp nhận JPEG, PNG, WebP, GIF tối đa 2 MB. Khi cập nhật bằng multipart, gửi `POST` kèm `_method=PUT`. API lưu dữ liệu ảnh trong bảng `catalog_images`, trả `image`/`logo` là `/api/catalog-images/{id}`; có thể tiếp tục dùng URL ảnh cũ nếu không tải tệp. Gửi `image`/`logo` rỗng khi sửa để xóa ảnh đã tải lên.
