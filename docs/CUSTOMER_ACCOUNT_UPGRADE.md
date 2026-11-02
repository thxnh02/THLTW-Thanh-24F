# Hồ sơ khách hàng và sổ địa chỉ

## Những gì đã được kiểm tra

Trước khi nâng cấp, backend có đăng ký, email OTP, đăng nhập bằng Sanctum, đăng xuất, quên và đặt lại mật khẩu. Bộ test cũ chạy trong SQLite cô lập: 60 bài, 657 assertions; frontend: 41 bài. Mã OTP được lưu dạng hash và email dùng SMTP cấu hình ở `backend/.env`. Kết quả test dùng mail giả, không xác nhận thư đã đến hộp thư thật.

Trang `/account` trước đây chỉ hiển thị tên và email. Chưa có API sửa hồ sơ, tải ảnh, địa chỉ hoặc đổi mật khẩu khi đã đăng nhập. Middleware `EnsureCustomerAccountActive` đã kiểm tra người bị chặn và phiên cũ; các API tài khoản mới dùng chung middleware này cùng `auth:sanctum`. Middleware nay từ chối cả request không có session và tài khoản chưa xác minh bằng 401, tránh lỗi 500 ở trường hợp không có session.

## Các API mới

Tất cả API dưới đây yêu cầu cookie session của chính khách hàng và CSRF cho thao tác ghi. Server suy ra `user_id` từ session; không nhận `user_id` gửi lên từ frontend.

| API | Mục đích |
| --- | --- |
| `GET /api/account/profile` | Hồ sơ và địa chỉ mặc định |
| `PATCH /api/account/profile` | Sửa tên và điện thoại liên hệ |
| `POST /api/account/avatar` | Tải ảnh JPEG/PNG/WebP tối đa 2 MB |
| `DELETE /api/account/avatar` | Xóa ảnh đại diện |
| `POST /api/account/security/password` | Đổi mật khẩu bằng mật khẩu hiện tại |
| `GET /api/account/addresses` | Danh sách địa chỉ của mình |
| `GET /api/account/addresses/{id}` | Chi tiết địa chỉ của mình |
| `POST /api/account/addresses` | Thêm địa chỉ |
| `PATCH /api/account/addresses/{id}` | Sửa địa chỉ |
| `DELETE /api/account/addresses/{id}` | Xóa địa chỉ |
| `PATCH /api/account/addresses/{id}/default` | Đặt địa chỉ mặc định |

Địa chỉ tối đa 10 mục. Mục đầu tiên tự làm mặc định. Khi xóa mục mặc định, mục còn lại có ID mới nhất được chọn. Mọi thay đổi mặc định chạy trong transaction và khóa bản ghi chủ tài khoản để tuần tự hóa thao tác trong MySQL. Test SQLite kiểm tra quy tắc tuần tự; SQLite không mô phỏng đầy đủ khóa hàng của MySQL. Quận/huyện là tùy chọn; tỉnh/thành và phường/xã nhập văn bản để không phụ thuộc vào danh sách đơn vị hành chính cũ. Không có dữ liệu giả và không tự liên kết địa chỉ vào đơn hàng đang có.

Ảnh được lưu tại `storage/app/public/avatars/{user_id}/` với tên ngẫu nhiên, trả URL công khai. Chỉ ảnh sở hữu của tài khoản trong đúng thư mục và mẫu tên do server tạo mới được xóa khi thay ảnh hoặc xóa ảnh. Với demo, ảnh có URL công khai và không chứa địa chỉ hay thông tin riêng khác. Nếu cần quyền riêng tư nghiêm ngặt cho ảnh, cần chuyển sang route tải ảnh có xác thực trong một bước riêng.

## Áp dụng migration trên MySQL local

Chưa chạy migration mới trên database Laragon của bạn. Trước khi áp dụng, xem trạng thái:

```powershell
cd backend
php artisan migrate:status
php artisan migrate --pretend
```

Hai migration mới chỉ thêm cột `users.phone`, `users.avatar_path` và tạo bảng `user_addresses`. Nếu lệnh `--pretend` chỉ liệt kê thay đổi mong đợi, chạy:

```powershell
php artisan migrate
```

Liên kết `backend/public/storage` với `backend/storage/app/public` đã được tạo trên máy local để ảnh đại diện hiển thị. Trên máy khác, nếu liên kết chưa có, chạy `php artisan storage:link` một lần. Không dùng lệnh tạo lại hoặc xóa database đang có dữ liệu. Sau migration, mở lại frontend nếu dev server đang chạy và kiểm tra `/account`, `/account/addresses`, `/account/security`.

## Kiểm tra thủ công trên trình duyệt

1. Dùng cùng hostname `127.0.0.1` cho Next.js và Laravel để cookie Sanctum hoạt động. Đăng nhập tài khoản đã xác minh, tải lại `/account` và kiểm tra tên/ảnh vẫn hiện trong header.
2. Sửa tên và điện thoại; kiểm tra header cập nhật ngay. Thử tải ảnh sai định dạng, ảnh trên 2 MB, thay ảnh, xóa ảnh.
3. Thêm hai địa chỉ, đổi mặc định, sửa, xóa mặc định, rồi xóa hết. Kiểm tra thông báo và summary ở `/account`.
4. Kiểm tra giao diện tại khoảng rộng 390px, 768px, 1440px; mở dialog địa chỉ bằng bàn phím, di chuyển focus, đóng bằng Escape và cuộn form trên điện thoại.
5. Đổi mật khẩu rồi đăng nhập lại. Thử mật khẩu hiện tại sai, phiên cũ, tài khoản bị chặn và tài khoản cũ chưa xác minh.
6. Kiểm tra lại đăng ký → OTP → đăng nhập và quên mật khẩu. Email đến inbox thật chỉ có thể xác nhận bằng SMTP đã cấu hình và địa chỉ nhận do bạn kiểm soát; test tự động không gửi email thật.

**Cần xử lý trước khi triển khai công khai:** các route `/api/admin/*` hiện vẫn chưa có xác thực và phân quyền server. Đăng nhập khách hàng không bảo vệ các route đó. Cần một bước Admin auth riêng có role, middleware và test trước khi public ứng dụng.
