# CT_24F – Cửa hàng công nghệ

Dự án cửa hàng công nghệ với Laravel JSON API và giao diện Next.js. Khách truy cập có thể xem danh mục, thương hiệu và sản phẩm. Trang quản trị hỗ trợ danh sách có phân trang, thêm, sửa, chuyển vào thùng rác, khôi phục và xóa vĩnh viễn cho cả ba loại dữ liệu. Frontend gọi API qua Axios.

Phiên bản hiện tại chưa có đăng nhập, giỏ hàng, đặt hàng hoặc thanh toán.

Các API quản trị (kể cả tải ảnh lên) hiện chưa có xác thực; chỉ chạy trong môi trường cục bộ cho tới khi bổ sung đăng nhập và phân quyền.

## Cài lần đầu với Laragon

1. Mở Laragon và bấm **Start All**.
2. Nhấp đúp `setup-mysql.bat`.
3. Nhấp đúp `start-dev.bat`.

`setup-mysql.bat` tạo `.env` từ mẫu khi chưa có, kiểm tra cấu hình MySQL, rồi tạo database `ecommerce_thltw` nếu cần và chạy migration/seed. Script giữ nguyên `.env` đã có, không xóa database, bảng hay dữ liệu hiện có.

## Chạy hằng ngày

1. Laragon: **Start All**.
2. Nhấp đúp `start-dev.bat`.

Frontend: `http://127.0.0.1:3000`

API: `http://127.0.0.1:8000/api`

Nếu port `8000` hoặc `3000` đang được dùng, đóng tiến trình đang dùng port đó rồi chạy lại script.

## Chạy bằng lệnh

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
- Admin CRUD có phân trang: `/api/admin/categories`, `/api/admin/brands`, `/api/admin/products`
- Thùng rác: `/api/admin/{categories|brands|products}/trash`
- Khôi phục: `POST /api/admin/{categories|brands|products}/{id}/restore`
- Xóa vĩnh viễn: `DELETE /api/admin/{categories|brands|products}/{id}/force`

## Frontend

- Cửa hàng: `/`, `/categories`, `/brands`, `/products`
- Quản trị: `/admin/category`, `/admin/brand`, `/admin/product`; mỗi mục có trang danh sách, thêm, sửa và thùng rác
- Xóa trong danh sách có hộp thoại xác nhận; thùng rác hỗ trợ khôi phục và xóa vĩnh viễn, với ô tích xác nhận trước khi xóa vĩnh viễn
- Form thêm/sửa sản phẩm, danh mục và thương hiệu cho phép tải ảnh hoặc logo từ máy (tối đa 2 MB), xem trước và xóa ảnh; nội dung ảnh được lưu trong MySQL
- Axios: `config/api.js` → service → axios client → Laravel API

Xem thêm [database](docs/DATABASE.md), [kiểm thử API](docs/API_TEST.md) và [cấu trúc frontend](docs/FRONTEND_ARCHITECTURE.md).
