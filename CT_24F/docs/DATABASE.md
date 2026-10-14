# Database và Laragon

Runtime dùng MySQL/MariaDB của Laragon.

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ecommerce_thltw
DB_USERNAME=root
DB_PASSWORD=
```

Chạy `setup-mysql.bat` sau khi Laragon Start All. Script chỉ dùng `CREATE DATABASE IF NOT EXISTS`, `php artisan migrate` và `php artisan db:seed`; không dùng `DROP DATABASE` hay `migrate:fresh`.

## Bảng trong phạm vi hiện tại

- `categories`: `parent_id` có thể rỗng, tự liên kết tới `categories.id`.
- `brands`: thông tin thương hiệu hiển thị công khai.
- `products`: `category_id` liên kết `categories.id`; `brand_id` có thể rỗng và liên kết `brands.id`. `sale_price` có thể rỗng, dùng cho giá khuyến mãi và phải thấp hơn `price` khi nhập qua API.
- `catalog_images`: lưu nội dung ảnh dạng base64, MIME và dung lượng; `owner_type`/`owner_id` gắn một ảnh với sản phẩm, danh mục hoặc thương hiệu. Cột `image`/`logo` ở bảng tương ứng lưu URL ngắn để đọc ảnh qua API, không chứa dữ liệu base64 trong phản hồi danh sách.

Cả ba bảng dùng `deleted_at` để chuyển bản ghi vào thùng rác trước khi xóa vĩnh viễn. Việc khôi phục sản phẩm yêu cầu danh mục và thương hiệu liên quan đang khả dụng.

Seeder dùng `slug` cố định và `firstOrCreate`, nên chạy `php artisan db:seed` nhiều lần không tạo trùng hay ghi đè dữ liệu đã chỉnh sửa. Có 14 sản phẩm khởi tạo để kiểm tra phân trang.

Ảnh tải lên được giữ khi bản ghi vào thùng rác hoặc khôi phục, và bị xóa khỏi `catalog_images` khi bản ghi bị xóa vĩnh viễn. Ảnh URL cũ vẫn được giữ nguyên.
