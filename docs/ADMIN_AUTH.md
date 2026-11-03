# Đăng nhập quản trị

Trang đăng nhập: `http://127.0.0.1:3000/admin/login`. Tài khoản mẫu trên máy local: `admin@example.test`. Mật khẩu được tạo ngẫu nhiên và lưu tại `backend/.env` trong biến `ADMIN_EXAMPLE_PASSWORD`; file này bị Git bỏ qua. Không đưa mật khẩu vào source hoặc ảnh chụp màn hình.

Để tạo tài khoản mẫu ở một máy khác:

1. Đặt `ADMIN_EXAMPLE_EMAIL` và mật khẩu riêng dài ít nhất 12 ký tự trong `backend/.env`.
2. Trong thư mục `backend`, chạy `php artisan migrate` rồi `php artisan db:seed --class=AdminExampleSeeder`.
3. Chạy Laravel và Next.js như README, sau đó đăng nhập tại `/admin/login`.

Seeder chỉ hoạt động khi `APP_ENV=local` hoặc `testing`. Nếu email đã thuộc tài khoản khách, seeder dừng mà không tự cấp quyền. Chạy lại seeder không đặt lại mật khẩu của tài khoản admin đã tồn tại.

API admin yêu cầu cookie session Sanctum, CSRF và cờ `is_admin`. Người chưa đăng nhập nhận `401`, tài khoản khách nhận `403`; tài khoản bị khóa, chưa xác minh hoặc phiên bị vô hiệu không được truy cập. Các thao tác danh sách người dùng không hiển thị hoặc khóa tài khoản admin. Đăng xuất admin làm mất hiệu lực phiên hiện tại.

Trang `/admin/recover` giải thích cách khôi phục. Admin kiểm soát hộp thư thật có thể dùng OTP của `/forgot-password` và `/reset-password`; việc đặt lại mật khẩu không tự cấp quyền admin. Với email mẫu `.test` không nhận được thư, người có quyền quản lý hệ thống cần cấp lại mật khẩu qua quy trình nội bộ trên máy local. Không có mật khẩu admin cố định trong frontend và không có đường tắt bỏ qua xác thực.
