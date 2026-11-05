# CT_24F — Technology Store

[Tiếng Việt](#tiếng-việt) | [English](#english)

## Tiếng Việt

CT_24F là website bán sản phẩm công nghệ gồm cửa hàng dành cho khách và trang quản trị. Giao diện xây dựng bằng Next.js, API bằng Laravel và dữ liệu lưu trong MySQL.

### Chức năng

- Khách hàng: tìm kiếm, lọc và xem sản phẩm; đăng ký, đăng nhập, quản lý hồ sơ và địa chỉ; giỏ hàng, mã giảm giá, đặt hàng COD, theo dõi đơn và thông báo.
- Đánh giá sản phẩm đã mua sau khi đơn được giao; xem bài viết, liên hệ và thông tin cửa hàng.
- Quản trị: quản lý sản phẩm, danh mục, thương hiệu, tồn kho, khách hàng, đơn hàng, mã giảm giá, đánh giá, bài viết, nội dung và thông tin cửa hàng. Danh sách hỗ trợ phân trang; các mục phù hợp có thùng rác, khôi phục và xóa vĩnh viễn.
- Xuất đơn hàng, gửi email thông báo và tích hợp VNPay Sandbox. Thanh toán chỉ được xác nhận sau khi máy chủ xác minh kết quả hợp lệ.

### Yêu cầu

- Windows với [Laragon](https://laragon.org/) và MySQL; các lệnh dưới đây dùng PowerShell.
- PHP 8.3 trở lên với các extension Laravel và PDO MySQL; [Composer](https://getcomposer.org/).
- Node.js 20.9 trở lên và npm, Git. Đảm bảo `php`, `composer`, `node`, `npm` và `git` chạy được trong terminal.

### Cài đặt lần đầu

1. Tải mã nguồn và mở thư mục:

   ```powershell
   git clone -b main https://github.com/thxnh02/THLTW-Thanh-24F.git
   cd THLTW-Thanh-24F
   ```

2. Mở Laragon, chọn **Start All**. Tạo một database MySQL trống tên `ecommerce_thltw` (ví dụ bằng phpMyAdmin). Nếu dùng database hoặc tài khoản khác, cập nhật các biến `DB_*` ở bước sau.
3. Cài backend và khởi tạo dữ liệu. Chỉ sao chép file cấu hình khi chưa có; không chạy seed trên dữ liệu đang sử dụng nếu chưa xem nội dung seeder.

   ```powershell
   cd backend
   Copy-Item .env.example .env
   composer install
   php artisan key:generate
   php artisan migrate
   php artisan db:seed
   ```

   Mặc định `.env.example` dùng MySQL tại `127.0.0.1:3306`, database `ecommerce_thltw`, user `root` và mật khẩu trống. Sửa `backend/.env` nếu Laragon của bạn khác.

4. Tạo tài khoản quản trị: mở `backend/.env`, đặt `ADMIN_EXAMPLE_EMAIL` thành email quản trị và `ADMIN_EXAMPLE_PASSWORD` thành mật khẩu riêng ít nhất 12 ký tự. Sau đó chạy trong thư mục `backend`:

   ```powershell
   php artisan db:seed --class=AdminExampleSeeder
   ```

   Tài khoản này dành cho môi trường local; email phải chưa thuộc tài khoản khách. Xem [hướng dẫn quản trị](docs/ADMIN_AUTH.md).
5. Cài frontend trong một terminal khác tại thư mục gốc project:

   ```powershell
   cd frontend
   Copy-Item .env.example .env.local
   npm.cmd ci
   ```

### Chạy website

Mở Laragon và chạy từng lệnh trong các terminal riêng:

```powershell
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

```powershell
cd frontend
npm.cmd run dev
```

- Cửa hàng: http://127.0.0.1:3000
- Đăng nhập quản trị: http://127.0.0.1:3000/admin/login
- API: http://127.0.0.1:8000/api

Trên Windows có thể dùng `start-dev.bat` sau khi cài xong. Nếu dùng email đơn hàng, giữ thêm worker chạy trong terminal tại `backend`:

```powershell
php artisan queue:work database --queue=order-emails --sleep=3 --tries=1 --timeout=30
```

### Sử dụng và cấu hình

Đăng nhập quản trị để thêm sản phẩm, cập nhật tồn kho, cài phí giao hàng, xử lý đơn và quản lý nội dung. Khách cần đăng nhập để thêm sản phẩm vào giỏ; sản phẩm có thể được đánh giá sau khi đơn tương ứng đã giao.

Email cần SMTP hợp lệ trong `backend/.env`; bật `ORDER_EMAIL_ENABLED=true` để gửi email đơn hàng và chạy worker như trên. Các tính năng dùng email như đặt lại mật khẩu cũng cần SMTP hoạt động. Không đưa `.env`, mật khẩu hay khóa lên Git.

VNPay Sandbox cần thông tin merchant riêng và Return/IPN HTTPS công khai được VNPay chấp nhận; chỉ nhập key vào `backend/.env`. Khi chưa cấu hình đủ, sử dụng COD. Tham khảo [Cloudflare Tunnel](docs/VNPAY_CLOUDFLARE_QUICK_TUNNEL.md). Môi trường sandbox không xử lý tiền thật.

### Cấu trúc và kiểm thử

`backend/` chứa Laravel API, migration, seeder và kiểm thử; `frontend/` chứa ứng dụng Next.js; `docs/` chứa hướng dẫn bổ sung. Kiểm tra tự động:

```powershell
cd backend
php artisan test --compact
```

```powershell
cd frontend
npm.cmd test
npm.cmd run lint
```

## English

CT_24F is a technology store with a customer storefront and an administration panel. It uses Next.js for the frontend, a Laravel API and a MySQL database.

### Features

- Product search and filters, customer accounts and addresses, cart, coupons, COD checkout, order tracking and notifications.
- Product reviews after delivery, articles, contact and store information.
- Administration for products, categories, brands, inventory, customers, orders, coupons, reviews, posts and store content. Lists are paginated; supported resources include trash and restoration.
- Order exports, notification emails and VNPay Sandbox integration. A payment is marked paid only after valid server-side verification.

### Requirements

Windows with [Laragon](https://laragon.org/) and MySQL, PHP 8.3 or newer with Laravel extensions and PDO MySQL, [Composer](https://getcomposer.org/), Node.js 20.9 or newer, npm and Git. The commands below use PowerShell.

### First-time setup

1. Clone and open the project:

   ```powershell
   git clone -b main https://github.com/thxnh02/THLTW-Thanh-24F.git
   cd THLTW-Thanh-24F
   ```

2. Start Laragon and MySQL. Create an empty MySQL database named `ecommerce_thltw`. Change `DB_*` in `backend/.env` if your database credentials differ from the defaults in `.env.example`.
3. Set up the backend. Only copy the configuration file if it does not already exist; review seeders before using them on an existing database.

   ```powershell
   cd backend
   Copy-Item .env.example .env
   composer install
   php artisan key:generate
   php artisan migrate
   php artisan db:seed
   ```

4. Set `ADMIN_EXAMPLE_EMAIL` and a unique `ADMIN_EXAMPLE_PASSWORD` of at least 12 characters in `backend/.env`, then run:

   ```powershell
   php artisan db:seed --class=AdminExampleSeeder
   ```

   This account is for local use; its email must not belong to an existing customer. See [admin authentication](docs/ADMIN_AUTH.md).
5. In a second terminal at the project root, set up the frontend:

   ```powershell
   cd frontend
   Copy-Item .env.example .env.local
   npm.cmd ci
   ```

### Run the application

Start MySQL in Laragon, then run the following in separate terminals:

```powershell
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

```powershell
cd frontend
npm.cmd run dev
```

Visit the [store](http://127.0.0.1:3000) or [admin sign-in](http://127.0.0.1:3000/admin/login). The API is at `http://127.0.0.1:8000/api`. On Windows, `start-dev.bat` can start the local services after setup.

For order emails, configure SMTP in `backend/.env`, set `ORDER_EMAIL_ENABLED=true`, and keep this worker running from `backend`:

```powershell
php artisan queue:work database --queue=order-emails --sleep=3 --tries=1 --timeout=30
```

Password reset and other email features also require working SMTP. Never commit `.env` files, passwords or private keys. VNPay Sandbox requires merchant credentials and public HTTPS Return/IPN URLs accepted by VNPay; see the [tunnel guide](docs/VNPAY_CLOUDFLARE_QUICK_TUNNEL.md). Use COD until it is configured. Sandbox transactions do not transfer real money.

### Project layout and checks

`backend/` contains the Laravel API, migrations, seeders and tests; `frontend/` contains the Next.js application; `docs/` contains additional guides.

```powershell
cd backend
php artisan test --compact
```

```powershell
cd frontend
npm.cmd test
npm.cmd run lint
```
