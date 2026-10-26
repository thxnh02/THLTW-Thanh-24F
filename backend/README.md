# CT_24F Backend

Laravel JSON API quản lý danh mục, thương hiệu và sản phẩm. Các API quản trị hỗ trợ CRUD, phân trang, thùng rác, khôi phục và xóa vĩnh viễn. Cơ sở dữ liệu mặc định là MySQL/MariaDB.

## Chạy trên máy

Từ thư mục `CT_24F`, chạy `setup-mysql.bat` để chuẩn bị cơ sở dữ liệu. Sau đó dùng `start-dev.bat` để mở API và frontend.

Hoặc chạy riêng backend:

```powershell
copy .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve --host=127.0.0.1 --port=8000
```

API bắt đầu tại `http://127.0.0.1:8000/api`. Các đường dẫn được khai báo trong `routes/api.php`.

## Kiểm tra

```powershell
php artisan test
```

Xem thêm [tài liệu API](../docs/API_TEST.md), [cơ sở dữ liệu](../docs/DATABASE.md) và [sơ đồ mã nguồn quản trị](../docs/ADMIN_CODE_GUIDE.md).
