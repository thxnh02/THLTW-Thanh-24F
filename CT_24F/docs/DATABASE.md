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
- `products`: `category_id` liên kết `categories.id`; `brand_id` có thể rỗng và liên kết `brands.id`.

Cả ba bảng dùng `deleted_at` để chuyển bản ghi vào thùng rác trước khi xóa vĩnh viễn. Việc khôi phục sản phẩm yêu cầu danh mục và thương hiệu liên quan đang khả dụng.

Seeder dùng `slug` cố định và `updateOrCreate`, nên chạy `php artisan db:seed` nhiều lần không tạo trùng dữ liệu khởi tạo. Có 14 sản phẩm để kiểm tra phân trang.
