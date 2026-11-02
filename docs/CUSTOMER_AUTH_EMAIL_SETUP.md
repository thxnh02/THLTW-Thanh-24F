# Thiết lập tài khoản khách hàng và email OTP

Tài liệu này hướng dẫn chạy đăng ký, xác minh email, đăng nhập và đặt lại mật khẩu trong môi trường CT_24F.

## Các trang và API

| Chức năng | Trang | API |
| --- | --- | --- |
| Tạo tài khoản | `/register` | `POST /api/auth/register` |
| Xác minh email | `/verify-email` | `POST /api/auth/email/verify`, `POST /api/auth/email/resend` |
| Đăng nhập | `/login` | `POST /api/auth/login` |
| Hồ sơ khách hàng | `/account` | `GET /api/auth/me`, `POST /api/auth/logout` |
| Quên mật khẩu | `/forgot-password` | `POST /api/auth/forgot-password` |
| Đặt lại mật khẩu | `/reset-password` | `POST /api/auth/forgot-password/reset` |

Đăng nhập dùng session cookie HttpOnly của Laravel Sanctum. Mã OTP có 6 chữ số, hết hạn sau 5 phút, chỉ dùng một lần và bị khóa sau 5 lần nhập sai. Gửi lại mã có thời gian chờ 60 giây. Mã chỉ được lưu dạng hash trong bảng `customer_email_otps`; frontend chỉ giữ mã trong trạng thái form, không đưa vào URL hay bộ nhớ trình duyệt lâu dài.

## Chạy migration an toàn

Trong `backend`, kiểm tra trạng thái trước:

```powershell
php artisan migrate:status
```

Hai migration mới chỉ thêm `email_verified_at` và `customer_auth_version` vào `users`, rồi tạo bảng `customer_email_otps`. Chúng không xóa hay thay thế dữ liệu hiện có. Khi các migration hiện có đều đã chạy và chỉ các migration mới đang chờ, áp dụng bằng:

```powershell
php artisan migrate
```

Không dùng `migrate:fresh`, `migrate:refresh` hoặc lệnh xóa database cho dự án đang có dữ liệu.

## Cấu hình cookie khi chạy local

Dùng cùng một hostname ở frontend và API để trình duyệt gửi cookie đúng origin. Cấu hình hiện tại chọn `127.0.0.1`:

- Frontend: `http://127.0.0.1:3000`
- Laravel: `http://127.0.0.1:8000`
- `frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api`

Trong `backend/.env`, giữ session/CORS/Sanctum như sau (các giá trị tương ứng có trong `.env.example`):

```dotenv
APP_URL=http://127.0.0.1:8000
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false
SANCTUM_STATEFUL_DOMAINS=127.0.0.1:3000,localhost:3000,127.0.0.1:8000,localhost:8000
CORS_ALLOWED_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
```

Nếu chuyển sang `localhost`, hãy đổi cả địa chỉ frontend, API URL và CORS cho thống nhất, sau đó xóa cookie cũ của trang. Khi triển khai HTTPS, đặt `SESSION_SECURE_COOKIE=true`, giới hạn origin/stateful domain vào domain thật và cấu hình HTTPS cho cả ứng dụng.

## Bật gửi email thật bằng SMTP

Không cần cung cấp thông tin email cho người hỗ trợ. Tự điền thông tin riêng trực tiếp trong `backend/.env`; không đưa mật khẩu SMTP vào Git, ảnh chụp, log hoặc biến `NEXT_PUBLIC_*`.

Ví dụ dùng Gmail SMTP:

```dotenv
MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=địa_chỉ_gmail_của_bạn
MAIL_PASSWORD=mật_khẩu_ứng_dụng_gmail
MAIL_FROM_ADDRESS=địa_chỉ_gmail_của_bạn
MAIL_FROM_NAME="CT_24F"
```

Với Gmail, bật Xác minh 2 bước rồi tạo **Mật khẩu ứng dụng**. Dùng mật khẩu ứng dụng 16 ký tự trong `MAIL_PASSWORD`, không dùng mật khẩu đăng nhập Gmail thông thường. Tính năng Mật khẩu ứng dụng chỉ có trên tài khoản đủ điều kiện. `MAIL_SCHEME=smtp` cùng cổng 587 dùng SMTP có STARTTLS; cổng 465 thường dùng `MAIL_SCHEME=smtps`. Với website triển khai thật, dùng đúng host, cổng, TLS và tài khoản gửi đã xác minh theo nhà cung cấp.

Sau khi sửa `.env`, chạy trong `backend`:

```powershell
php artisan config:clear
```

Không đặt `MAIL_MAILER=log` hoặc `array` nếu muốn nhận email thật: hai driver đó không gửi thư đến hộp thư. Ứng dụng không báo gửi thành công khi SMTP chưa sẵn sàng hoặc gửi lỗi; người dùng có thể yêu cầu mã khác sau đó.

## Kiểm tra gửi thư thủ công

1. Điền SMTP riêng trong `backend/.env`, bật Laragon/MySQL và chạy migration an toàn ở trên.
2. Chạy API tại `127.0.0.1:8000` và frontend tại `127.0.0.1:3000`.
3. Đăng ký bằng địa chỉ email bạn kiểm soát. Kiểm tra hộp thư đến và thư rác; thư có mã xác minh và thông báo thời hạn 5 phút.
4. Xác minh, đăng nhập, tải lại trang `/account`, rồi đăng xuất.
5. Dùng “Quên mật khẩu”, nhận mã đặt lại, đổi mật khẩu và đăng nhập bằng mật khẩu mới.
6. Thử nhập sai mã, dùng mã hết hạn hoặc dùng lại mã đã xác nhận; các trường hợp này phải bị từ chối.

Kiểm tra với `Mail::fake()` trong test chỉ xác nhận ứng dụng tạo và gửi đúng loại thư; nó không chứng minh thư đã đến inbox. Chỉ đánh dấu gửi email thật thành công sau khi hoàn tất smoke test bằng SMTP thực.

## Tài khoản cũ và quyền truy cập

Các tài khoản cũ được giữ nguyên. Chúng không được tự động đánh dấu đã xác minh. Tài khoản có mật khẩu rỗng/null không thể đăng nhập bằng mật khẩu cho đến khi chủ email dùng quy trình quên mật khẩu để đặt mật khẩu mới; sau đó vẫn phải xác minh email trước khi đăng nhập. Tài khoản bị chặn vẫn bị từ chối khi đăng nhập, xác minh và đặt lại mật khẩu.

Đăng nhập khách hàng không cấp quyền quản trị. Các API `/api/admin/*` hiện đã yêu cầu tài khoản có quyền admin; xem [ADMIN_AUTH.md](ADMIN_AUTH.md).
