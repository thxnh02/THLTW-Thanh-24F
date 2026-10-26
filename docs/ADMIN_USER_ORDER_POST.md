# Quản trị người dùng, đơn hàng và bài viết

Ba phần này được bổ sung cho project `CT_24F`; không thay thế các bảng danh mục, thương hiệu và sản phẩm.

- Người dùng: `GET /api/admin/users`, `GET /api/admin/users/{id}`, `PATCH /api/admin/users/{id}/block`, `PATCH /api/admin/users/{id}/unblock`. Việc khóa chỉ cập nhật `blocked_at`, không xóa tài khoản hoặc đơn hàng. Resource không trả mật khẩu/token.
- Đơn hàng: `GET /api/admin/orders`, `GET /api/admin/orders/{id}`, `PATCH /api/admin/orders/{id}/status`. Trạng thái tối thiểu là `pending → processing → delivered`; `pending` là giả định cần thiết để có điểm bắt đầu, còn `processing` và `delivered` được nêu trong tài liệu bảng. Không có xóa đơn, thanh toán, tồn kho hay chi tiết mặt hàng vì project hiện chưa có những nghiệp vụ này.
- Bài viết: `GET/POST /api/admin/posts`, `GET/PUT/DELETE /api/admin/posts/{id}`. Xóa thường là xóa mềm; `GET /api/admin/posts/trash` liệt kê thùng rác có phân trang, `POST /api/admin/posts/{id}/restore` khôi phục và `DELETE /api/admin/posts/{id}/force` xóa vĩnh viễn bản ghi đã nằm trong thùng rác. Giao diện có xác nhận ngay tại danh sách/chi tiết và ở trang `/admin/posts/trash`; xóa vĩnh viễn cần tích xác nhận.

Ba migration mới tạo `users`, `orders` và `posts`; migration tiếp theo bổ sung `deleted_at` cho `posts` mà không xóa dữ liệu cũ. `orders.user_id` tham chiếu người dùng; User có quan hệ `orders`. Các trang admin tương ứng là `/admin/users`, `/admin/orders` và `/admin/posts`; mỗi danh sách dùng phân trang từ API.

Trang cửa hàng có `/posts` và `/posts/{slug}` với API công khai `GET /api/posts` và `GET /api/posts/{slug}`. Chỉ bài `status = true` chưa bị xóa mềm xuất hiện; danh sách phân trang 9 bài và trang chủ hiển thị tối đa 3 bài mới. Người dùng và đơn hàng vẫn chỉ nằm trong trang admin: chưa có đăng nhập/đặt hàng, nên không hiển thị dữ liệu khách hoặc đơn hàng cho người truy cập công khai.

Seeder mẫu `AdminDemoSeeder` được chạy riêng bằng `php artisan db:seed --class=AdminDemoSeeder` trong `CT_24F/backend`. Seeder thêm 12 người dùng với email `ct24f-demoXX@example.test`, 15 đơn hàng thuộc các trạng thái khác nhau và 12 bài viết có slug bắt đầu bằng `ct24f-demo-`. Chạy lại không tạo trùng và không ghi đè bản ghi đã chỉnh. Người dùng mẫu không có mật khẩu, chỉ để xem/quản lý trên trang admin; không dùng làm tài khoản đăng nhập. `DatabaseSeeder` mặc định không tự chạy seeder này.

**Giới hạn bảo mật:** các route `/api/admin/*` hiện không có middleware xác thực trong project gốc. Chức năng này chỉ phù hợp môi trường phát triển nội bộ, không đưa lên server công khai. Project chưa có luồng đăng nhập, nên `blocked_at` hiện chỉ là trạng thái quản trị; khi bổ sung đăng nhập cần kiểm tra cờ này trong luồng xác thực. Không tạo hệ xác thực mới trong phần này.

Chạy `php artisan migrate` trong `CT_24F/backend` sau khi MySQL/Laragon hoạt động. Không chạy `migrate:fresh`, không xóa dữ liệu cũ.
