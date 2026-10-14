# CT_24F - Course ecommerce API

Project nhỏ theo phạm vi bài học hiện tại: Laravel JSON API, Next.js, Axios, danh mục, thương hiệu và danh sách sản phẩm có phân trang. Không có đăng nhập, giỏ hàng, đơn hàng hay thanh toán.

## Cài lần đầu với Laragon

1. Mở Laragon và bấm **Start All**.
2. Nhấp đúp `setup-mysql.bat`.
3. Nhấp đúp `start-dev.bat`.

`setup-mysql.bat` chỉ tạo/cấu hình `.env` từ mẫu khi file chưa tồn tại; `.env` sẵn có được giữ nguyên và phải trỏ tới MySQL `127.0.0.1:3306`, database `ecommerce_thltw`, user `root`. Script sẽ dừng trước khi tạo database/chạy migration nếu cấu hình hiện tại khác. Sau đó script tạo database nếu chưa có và chạy migration/seed, không xóa database, bảng hay dữ liệu hiện có.

## Chạy hằng ngày

1. Laragon: **Start All**.
2. Nhấp đúp `start-dev.bat`.

Frontend: `http://127.0.0.1:3000`  
API: `http://127.0.0.1:8000/api`

Nếu port `8000` hoặc `3000` đang được dùng, đóng tiến trình đang dùng port đó rồi chạy lại script.

## Lệnh thủ công để học

```powershell
cd backend
copy .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve --host=127.0.0.1 --port=8000
```

```powershell
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

## Phạm vi API

- `GET /api/categories`
- `GET /api/categories/{slug}`
- `GET /api/brands`
- `GET /api/products?page=2` — chính xác 12 sản phẩm mỗi trang
- Admin CRUD có phân trang và thùng rác: `/api/admin/categories`, `/api/admin/brands`, `/api/admin/products`
- Admin có thể khôi phục hoặc xóa vĩnh viễn bản ghi trong thùng rác; xóa vĩnh viễn bị chặn khi còn dữ liệu liên quan.

Luồng theo bài học: **Model → FormRequest → Controller → Resource → Route → Test**.

## Frontend

- Shop: `/categories`, `/brands`, `/products`
- Admin danh mục, thương hiệu và sản phẩm: trang danh sách, thêm, sửa, thùng rác, khôi phục và xác nhận trước khi xóa.
- Khu vực quản trị hiện chưa có đăng nhập/phân quyền; chỉ chạy trong môi trường học tập cục bộ, không đưa lên môi trường công khai.
- Axios: `config/api.js` → service → axios client → Laravel API

Xem thêm [database](docs/DATABASE.md), [kiểm thử API](docs/API_TEST.md) và [cấu trúc frontend](docs/FRONTEND_ARCHITECTURE.md).
