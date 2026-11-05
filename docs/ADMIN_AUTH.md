# Đăng nhập quản trị

Trang đăng nhập: `http://127.0.0.1:3000/admin/login`. Tài khoản mẫu trên máy local: `admin@example.test`. Mật khẩu được tạo ngẫu nhiên và lưu tại `backend/.env` trong biến `ADMIN_EXAMPLE_PASSWORD`; file này bị Git bỏ qua. Không đưa mật khẩu vào source hoặc ảnh chụp màn hình.

Để tạo tài khoản mẫu ở một máy khác:

1. Đặt `ADMIN_EXAMPLE_EMAIL` và mật khẩu riêng dài ít nhất 12 ký tự trong `backend/.env`.
2. Trong thư mục `backend`, chạy `php artisan migrate` rồi `php artisan db:seed --class=AdminExampleSeeder`.
3. Chạy Laravel và Next.js như README, sau đó đăng nhập tại `/admin/login`.

Seeder chỉ hoạt động khi `APP_ENV=local` hoặc `testing`. Nếu email đã thuộc tài khoản khách, seeder dừng mà không tự cấp quyền. Chạy lại seeder không đặt lại mật khẩu của tài khoản admin đã tồn tại.

API admin dùng cookie HttpOnly riêng `ct24f_admin_auth`, có phạm vi `/api/admin`; cookie lưu token ngẫu nhiên, còn máy chủ chỉ lưu mã băm của token trong `admin_browser_sessions`. Cookie khách hàng Sanctum vẫn hoạt động độc lập. Đăng nhập hoặc đăng xuất admin không thay đổi phiên khách hàng. Các API ghi vẫn dùng bảo vệ CSRF của Laravel. Tài khoản bị khóa, chưa xác minh, bị gỡ quyền admin hoặc có phiên bị vô hiệu không được truy cập. Đăng xuất admin thu hồi phiên admin hiện tại.

Cookie admin hết hạn cùng thời lượng với `SESSION_LIFETIME`, dùng `HttpOnly`, `SameSite=Lax`, chỉ truyền qua HTTPS khi `SESSION_SECURE_COOKIE=true`, và chỉ gửi tới `/api/admin`. Chạy migration `2026_11_04_000001_create_admin_browser_sessions_table` trước khi dùng phiên quản trị mới.

Trang `/admin/recover` giải thích cách khôi phục. Admin kiểm soát hộp thư thật có thể dùng OTP của `/forgot-password` và `/reset-password`; việc đặt lại mật khẩu không tự cấp quyền admin. Với email mẫu `.test` không nhận được thư, người có quyền quản lý hệ thống cần cấp lại mật khẩu qua quy trình nội bộ trên máy local. Không có mật khẩu admin cố định trong frontend và không có đường tắt bỏ qua xác thực.
