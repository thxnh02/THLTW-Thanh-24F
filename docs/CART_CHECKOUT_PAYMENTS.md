# Giỏ hàng, đặt hàng và thanh toán

## Chuẩn bị trên máy local

1. Sao lưu MySQL trước khi thay đổi schema. Trong `backend`, chạy `php artisan migrate:status` và `php artisan migrate --pretend` để xem migration mới. Sau khi tự kiểm tra, chạy `php artisan migrate`. Không dùng `migrate:fresh` hoặc `migrate:refresh` với dữ liệu đang sử dụng.
2. `backend/.env`: `APP_ENV=local` và `COD_DEMO_ENABLED=true` để cho phép COD mô phỏng. Cờ này luôn bị chặn trong production. Không sao chép tài khoản admin mẫu hoặc mật khẩu mẫu lên production.
   Để gửi email thông báo đơn hàng cho hộp thư **đã xác minh**, bật `ORDER_EMAIL_ENABLED=true` sau khi cấu hình SMTP. Mặc định tắt; lỗi gửi thư được ghi trạng thái `failed` trên thông báo và không hủy đơn/thanh toán.
3. Chạy Laravel và Next.js như README. Giỏ khách chỉ lưu `product_id` và `quantity` trong localStorage. Khi đăng nhập, client gọi API merge và chỉ xóa các dòng đã được máy chủ xác nhận.

## Trạng thái

`orders.status` là xử lý đơn: `pending → processing → delivered`, hoặc khách hủy COD demo còn `pending` thành `cancelled`. `payment_status` là thanh toán: COD demo tạo `demo_paid` ngay trên máy chủ; đây **không phải tiền đã thu**. VNPay bắt đầu `pending`, chỉ IPN có chữ ký hợp lệ với mã phản hồi và trạng thái giao dịch đều `00` mới chuyển thành `paid`. IPN thất bại xác thực được có thể chuyển thành `failed`; đơn có thể thử thanh toán lại với tham chiếu mới. Trang Return không ghi trạng thái thanh toán.

Tồn kho `NULL` nghĩa là không theo dõi, số `0` nghĩa là hết hàng. Với hàng có theo dõi kho, số lượng bị trừ khi đặt và được hoàn đúng một lần khi khách hủy COD demo. Đơn VNPay chờ IPN giữ tồn kho; không tự giải phóng chỉ vì người dùng đóng trình duyệt. Cần đối soát thủ công nếu IPN không tới.

Giá được tính lại trên máy chủ từ giá khuyến mãi hợp lệ, làm tròn VND theo quy tắc phần lẻ từ 0,50 đồng được làm tròn lên. Phí giao hàng là **0 đồng cố định cho demo**, không phải báo giá vận chuyển thực. Đơn lưu ảnh, tên, giá và địa chỉ nhận tại thời điểm đặt, nên sửa địa chỉ sau đó không thay đổi đơn.
Giỏ hàng ghi giá ở lúc thêm chỉ để báo khi giá hiện tại thay đổi; giá này không quyết định tiền phải trả. Khách xem lại tổng tiền ở trang đặt hàng trước khi xác nhận.

## VNPay Sandbox

Để bật trên hệ thống thử nghiệm, đặt `VNPAY_ENABLED=true`, `VNPAY_ENV=sandbox`, `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`, `VNPAY_RETURN_URL` HTTPS dẫn đến `/payment-result` của frontend và `VNPAY_IPN_URL` HTTPS dẫn đến `GET /api/payments/vnpay/ipn` của backend. Cấu hình cùng IPN URL tại cổng merchant VNPay; endpoint phải truy cập được từ Internet. Localhost không nhận IPN trực tiếp; dùng tunnel HTTPS hoặc triển khai thử nghiệm có kiểm soát. Không đưa hash secret vào frontend hay Git. Khi thiếu cấu hình, tùy chọn VNPay bị khóa.

Ứng dụng tạo tham chiếu giao dịch duy nhất, số tiền VND nhân 100, ký HMAC-SHA512. IPN xác thực chữ ký, mã merchant, loại tiền, tham chiếu và số tiền trước khi cập nhật. Callback trùng được trả mã xác nhận trùng và không tạo thanh toán hoặc thông báo lần hai. Trang `/payment-result` chỉ đọc kết quả từ máy chủ và làm mới mỗi 10 giây khi còn chờ. Chưa có tích hợp API truy vấn/đối soát VNPay tự động; quản trị cần rà soát các đơn chờ lâu trước khi quyết định xử lý.

Không có giao dịch VNPay thực hoặc sandbox nào được thực hiện tự động khi xây tính năng. Kiểm thử IPN dùng secret và dữ liệu tổng hợp trong SQLite.

## API chính

| Phương thức | Đường dẫn | Chức năng |
| --- | --- | --- |
| GET | `/api/commerce/options` | Phương thức đang được bật |
| GET, DELETE | `/api/account/cart` | Xem/xóa giỏ đăng nhập |
| POST | `/api/account/cart/items` | Thêm sản phẩm |
| PATCH, DELETE | `/api/account/cart/items/{product}` | Đổi số lượng/xóa |
| POST | `/api/account/cart/merge` | Gộp giỏ khách đã kiểm tra |
| GET, POST | `/api/account/orders` | Danh sách/tạo đơn |
| GET | `/api/account/orders/{id}` | Đơn của chính khách |
| POST | `/api/account/orders/{id}/retry-payment` | Thử VNPay lại |
| POST | `/api/account/orders/{id}/cancel` | Hủy COD demo đang chờ xử lý |
| GET, PATCH | `/api/account/notifications`, `/api/account/notifications/{id}/read` | Thông báo theo chủ sở hữu |
| GET | `/api/payments/vnpay/ipn` | IPN ký từ cổng thanh toán |
| GET | `/api/payments/vnpay/return` | Kiểm tra chữ ký Return để hiển thị, không cập nhật thanh toán |

Tất cả đường dẫn `/api/account/*` yêu cầu phiên Sanctum của tài khoản còn hoạt động; email khách chưa xác minh vẫn được dùng. Đơn và thông báo lọc theo người đăng nhập. `idempotency_key` UUID của lần đặt hàng tránh tạo đơn đôi khi gửi lại yêu cầu.

## Kiểm tra thủ công sau migration

1. Ở cửa sổ khách, thêm sản phẩm, tải lại trang, mở `/cart`; đăng nhập và kiểm tra giỏ được gộp một lần. Thử sản phẩm đã ẩn/xóa mềm và sản phẩm có tồn kho 0.
2. Tạo/sửa địa chỉ ngay trong `/checkout`, chọn COD demo, xác nhận tổng tiền. Chi tiết đơn phải ghi rõ **mô phỏng**, trạng thái xử lý còn chờ và chỉ có một đơn khi gửi lại cùng khóa.
3. Kiểm tra `/account/orders`, thông báo chưa đọc/đã đọc và trang quản trị `/admin/orders`. Sửa địa chỉ đã lưu sau khi đặt; bản chụp địa chỉ trong đơn phải giữ nguyên.
4. Với VNPay Sandbox đã cấu hình và IPN HTTPS đến được, thử giao dịch được phép trên tài khoản thử nghiệm. Return URL chỉ hiện **đang chờ** cho đến khi IPN hợp lệ đổi trạng thái. Không dùng thẻ hoặc tài khoản thật trong quá trình kiểm tra.
5. Ở màn hình 390 px và desktop, thử tăng/giảm, nhập số lượng, nút Mua ngay, hộp thoại địa chỉ và điều hướng bàn phím. Kiểm tra không có cuộn ngang.
