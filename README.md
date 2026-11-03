# CT_24F – Cửa hàng công nghệ

Dự án cửa hàng công nghệ với Laravel JSON API và giao diện Next.js. Khách truy cập có thể xem danh mục, thương hiệu và sản phẩm. Trang quản trị hỗ trợ danh sách có phân trang, thêm, sửa, chuyển vào thùng rác, khôi phục và xóa vĩnh viễn cho cả ba loại dữ liệu. Frontend gọi API qua Axios.

Phiên bản hiện tại có đăng nhập khách/admin, hồ sơ và sổ địa chỉ, giỏ hàng, Mua ngay độc lập, đặt hàng COD mô phỏng và tích hợp VNPay Sandbox. Xác minh email là tùy chọn cho khách; đặt lại mật khẩu vẫn cần OTP gửi qua email. VNPay chỉ được ghi đã thanh toán khi máy chủ nhận IPN hoặc QueryDr có chữ ký hợp lệ, đúng merchant, tham chiếu và số tiền.

Trang `/admin` và các API `/api/admin/*` yêu cầu phiên đăng nhập có quyền quản trị. Tài khoản mẫu local được hướng dẫn trong [docs/ADMIN_AUTH.md](docs/ADMIN_AUTH.md).

Migration đối soát mới bổ sung mốc tạo URL và nhật ký thanh toán. Migration này đã được áp dụng trên MySQL Laragon của máy phát triển ngày 03/11/2026; khi cài trên máy khác, hãy sao lưu và xem trước `php artisan migrate:status`, `php artisan migrate --pretend` trước khi chạy. VNPay yêu cầu tối thiểu 5.000 đồng; QueryDr mặc định tắt và cần merchant Sandbox cùng IPN HTTPS đến được. Xem [hướng dẫn giỏ hàng, đối soát và thanh toán](docs/CART_CHECKOUT_PAYMENTS.md).

## Cài lần đầu với Laragon

1. Mở Laragon và bấm **Start All**.
2. Nhấp đúp `setup-mysql.bat`.
3. Nhấp đúp `start-dev.bat`.

`setup-mysql.bat` tạo `.env` từ mẫu khi chưa có, kiểm tra cấu hình MySQL, rồi tạo database `ecommerce_thltw` nếu cần và chạy migration/seed. Script giữ nguyên `.env` đã có, không xóa database, bảng hay dữ liệu hiện có.

Nếu máy đã có dữ liệu, bỏ qua `setup-mysql.bat`; tự sao lưu, xem `migrate:status`/`migrate --pretend`, rồi mới chạy `php artisan migrate` khi sẵn sàng.

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
- Giỏ hàng khách lưu ID/số lượng tại trình duyệt; sau đăng nhập đồng bộ với `/api/account/cart/*`
- Đặt hàng: `POST /api/account/orders`; lịch sử: `GET /api/account/orders`
- Thông báo: `GET /api/account/notifications`
- VNPay Sandbox: `GET /api/payments/vnpay/ipn` và `GET /api/payments/vnpay/return`
- Admin CRUD có phân trang: `/api/admin/categories`, `/api/admin/brands`, `/api/admin/products`
- Thùng rác: `/api/admin/{categories|brands|products}/trash`
- Khôi phục: `POST /api/admin/{categories|brands|products}/{id}/restore`
- Xóa vĩnh viễn: `DELETE /api/admin/{categories|brands|products}/{id}/force`

## Frontend

- Cửa hàng: `/`, `/categories`, `/brands`, `/products`, `/cart`, `/checkout`, `/account/orders`, `/account/notifications`
- Quản trị: `/admin/category`, `/admin/brand`, `/admin/product`; mỗi mục có trang danh sách, thêm, sửa và thùng rác
- Xóa trong danh sách có hộp thoại xác nhận; thùng rác hỗ trợ khôi phục và xóa vĩnh viễn, với ô tích xác nhận trước khi xóa vĩnh viễn
- Form thêm/sửa sản phẩm, danh mục và thương hiệu cho phép tải ảnh hoặc logo từ máy (tối đa 2 MB), xem trước và xóa ảnh; nội dung ảnh được lưu trong MySQL
- Axios: `config/api.js` → service → axios client → Laravel API

Xem thêm [database](docs/DATABASE.md), [kiểm thử API](docs/API_TEST.md) và [cấu trúc frontend](docs/FRONTEND_ARCHITECTURE.md).
