# VNPay Sandbox, SMTP và xuất đơn hàng trên máy local

Tài liệu này dành cho môi trường phát triển CT_24F trên Windows/Laragon. Cấu hình chỉ phục vụ VNPay Sandbox, không xử lý giao dịch tiền thật. Không chép bí mật vào Git, ảnh chụp, log hoặc chat.

## Chạy ứng dụng qua một host HTTPS

Laragon tiếp tục chạy Laravel tại `http://127.0.0.1:8000` và Next.js tại `http://127.0.0.1:3000`. Trước hết kiểm tra `Get-Command cloudflared -ErrorAction SilentlyContinue`; máy phát triển được kiểm tra lúc chuẩn bị hướng dẫn nhưng `cloudflared` chưa cài. Để VNPay gọi IPN từ Internet, cần đưa Next.js ra một host HTTPS; Next rewrites `/api/*` và `/sanctum/*` về Laravel, vì vậy trình duyệt và callback dùng cùng một origin.

1. Tải `cloudflared` từ [Cloudflare Tunnel downloads](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/) hoặc tải bản Windows AMD64 chính thức bằng PowerShell:
   ```powershell
   $cloudflaredPath = "$env:USERPROFILE\Downloads\cloudflared.exe"
   Invoke-WebRequest "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cloudflaredPath
   ```
2. Trong `backend`, khởi động Laravel: `php artisan serve --host=127.0.0.1 --port=8000`.
3. Trong `frontend/.env.local`, đặt `NEXT_PUBLIC_API_URL=/api` và `BACKEND_INTERNAL_URL=http://127.0.0.1:8000`. Khởi động Next.js bằng `npm run dev -- --hostname 127.0.0.1 --port 3000`; khởi động lại Next sau khi đổi env.
4. Mở terminal khác và chạy `cloudflared tunnel --url http://127.0.0.1:3000` (hoặc `& "$env:USERPROFILE\Downloads\cloudflared.exe" tunnel --url http://127.0.0.1:3000` nếu vừa tải file ở bước 1). Quick Tunnel cung cấp hostname HTTPS tạm thời; hostname có thể đổi sau khi tắt tunnel. Muốn URL cố định cần Cloudflare Tunnel có tên và hostname riêng.
5. Chỉ dùng cơ sở dữ liệu cô lập với tài khoản/sản phẩm thử nghiệm. Host công khai có thể truy cập ứng dụng trong lúc tunnel chạy. Không dùng dữ liệu khách hàng thật; không bật hoặc công khai giao diện quản trị nếu chưa giới hạn quyền truy cập. Quick Tunnel có thể không đáp ứng yêu cầu đăng ký/whitelist URL của merchant VNPay.

Với HTTPS qua proxy, `backend/.env` cần URL công khai hiện tại trong `APP_URL`, `FRONTEND_URL=https://<host>`, `VNPAY_RETURN_URL=https://<host>/vnpay-return` (hoặc `/payment-result` nếu đúng URL merchant đã đăng ký), `VNPAY_IPN_URL=https://<host>/api/payments/vnpay/ipn`, `SESSION_SECURE_COOKIE=true`, `SESSION_SAME_SITE=lax`, `SANCTUM_STATEFUL_DOMAINS=<host>`, `CORS_ALLOWED_ORIGINS=https://<host>` và `TRUSTED_PROXIES=127.0.0.1,::1`. Giữ `SESSION_DOMAIN=null`. Frontend gọi `/api` cùng origin. Sau env update: `php artisan config:clear`; không chạy `key:generate`. Cần dùng đúng host cho trình duyệt, Return URL, IPN, Sanctum và CORS.

## VNPay Sandbox

Điền riêng trong `backend/.env`, lấy các giá trị từ tài khoản merchant Sandbox của bạn:

```dotenv
VNPAY_ENABLED=true
VNPAY_ENV=sandbox
VNPAY_TMN_CODE=<sandbox-merchant-code>
VNPAY_HASH_SECRET=<sandbox-hash-secret>
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://<host>/payment-result
VNPAY_IPN_URL=https://<host>/api/payments/vnpay/ipn
VNPAY_QUERY_ENABLED=false
VNPAY_QUERY_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
VNPAY_QUERY_IP=<public-egress-ip-allowed-by-merchant>
```

Không bật QueryDr cho tới khi VNPay cấp quyền, URL HTTPS/IPN được đăng ký và IP egress được merchant cho phép. Sau khi sửa env, trong `backend` chạy `php artisan config:clear`, rồi `php artisan commerce:check-vnpay`. Khi hostname công khai đã hoạt động, `php artisan commerce:check-vnpay --check-ipn` gửi một GET không chứa dữ liệu giao dịch đến IPN để kiểm tra callback; đây không phải giao dịch thanh toán. Lệnh không in merchant secret. Với config cache đang bật, chẩn đoán sẽ nhắc xóa cache sau khi sửa `.env`.

Mã merchant, hash secret, Return URL và IPN URL phải thuộc cấu hình merchant Sandbox tương ứng. Checksum secret Sandbox đã được chia sẻ trước đây cần được xem là có thể đã lộ; hãy xoay vòng tại merchant portal trước khi dùng. Không có credential thì tính năng thanh toán vẫn tắt. Chỉ thử bằng thông tin Sandbox và phương thức thanh toán thử nghiệm do VNPay cung cấp.

## SMTP và email đơn hàng

Gmail cần bật xác minh 2 bước và tạo App Password. Không dùng mật khẩu đăng nhập thường. Đặt các biến trong `backend/.env`:

```dotenv
MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=<gmail-sender>
MAIL_PASSWORD=<gmail-app-password>
MAIL_FROM_ADDRESS=<gmail-sender>
MAIL_FROM_NAME="CT_24F"
ORDER_EMAIL_ENABLED=true
ORDER_ADMIN_EMAIL=<optional-admin-inbox>
```

Chạy `php artisan config:clear`, rồi `php artisan commerce:check-mail` để kiểm tra các trường đã có mà không gửi thư hay in email/mật khẩu. Sau đó, chỉ định một hộp thư bạn kiểm soát để gửi đúng một thư thử: `php artisan commerce:mail-test <your-email>`. Lệnh gửi chỉ chạy trong `local`/`testing`; thông báo thành công chỉ có nghĩa SMTP nhận thư, không khẳng định thư vào Inbox. Kiểm tra cả Spam. Mã OTP vẫn hết hạn sau 5 phút và gửi lại bị giới hạn thời gian.

Khi bật email đơn hàng, email tài khoản đã xác minh có chi tiết đơn. Tài khoản chưa xác minh chỉ nhận thư chung cho sự kiện đơn mới, không có mã đơn, mặt hàng, địa chỉ hay số điện thoại. Inbox admin tùy chọn chỉ nhận mã đơn và tổng tiền. Email được thử sau khi transaction ghi đơn commit; lỗi SMTP không hủy đơn. Mỗi loại thư lưu trạng thái riêng, tối đa 3 lần thử. Lệnh `php artisan commerce:retry-order-emails --limit=20` xem trước; chỉ thêm `--execute` sau khi kiểm tra SMTP. Gửi SMTP không hỗ trợ đảm bảo exactly-once nếu tiến trình dừng ngay sau khi máy chủ mail nhận thư.

## Migration theo dõi gửi thư

Migration `2026_11_03_000002_add_order_email_delivery_tracking` chỉ thêm bốn cột theo dõi vào `customer_notifications`. Nó chưa được áp dụng trên MySQL Laragon. Có thể xem trạng thái và SQL dự kiến bằng `php artisan migrate:status` và `php artisan migrate --pretend`. **Chưa chạy `php artisan migrate` cho migration này cho tới khi chủ dự án cho phép riêng.** Không dùng `migrate:fresh`, `migrate:refresh` hoặc seed để thay dữ liệu hiện có.

## PDF và CSV

- Khách đã đăng nhập tải PDF cho đơn của chính mình tại trang `/account/orders/{id}`. API là `GET /api/account/orders/{id}/export/pdf`; đơn của tài khoản khác trả về 404.
- Admin đã đăng nhập tải PDF từ `/admin/orders/{id}` qua `GET /api/admin/orders/{id}/export/pdf`.
- Trang `/admin/orders` có bộ lọc ngày tạo, trạng thái đơn và trạng thái thanh toán. Nút CSV xuất đúng bộ lọc đang chọn qua `GET /api/admin/orders/export/csv`. CSV có BOM UTF-8 để Excel nhận tiếng Việt, bảo vệ ô bắt đầu bằng ký tự công thức và không có thông tin giao/địa chỉ.
- PDF dùng font DejaVu Sans đi kèm Dompdf để hiển thị tiếng Việt. Bản PDF là bản chụp thông tin đơn để tham khảo, không phải hóa đơn VAT.

## Lỗi thường gặp

- **IPN không tới hoặc diagnostic báo FAIL:** giữ cả hai server chạy, xác nhận tunnel vẫn hoạt động, dùng đúng hostname HTTPS hiện tại và đăng ký IPN/Return trong merchant portal. Đường IPN phải là `/api/payments/vnpay/ipn`.
- **Đăng nhập mất sau khi quay lại từ VNPay:** frontend, Return và API phải cùng hostname; đặt `SANCTUM_STATEFUL_DOMAINS` là hostname đó, `SESSION_SECURE_COOKIE=true`, `SESSION_SAME_SITE=lax`; sau đó chạy `php artisan config:clear`, xóa cookie cũ và đăng nhập lại.
- **Cấu hình mới không có hiệu lực:** chạy `php artisan config:clear` trong `backend`, khởi động lại Laravel và Next.js sau khi sửa env.
- **Gmail từ chối SMTP:** bật xác minh 2 bước, tạo App Password, dùng cổng 587 với STARTTLS, xác nhận MAIL_FROM khớp tài khoản gửi. Không thay bằng mật khẩu đăng nhập Google.
- **Email thử được SMTP chấp nhận nhưng không thấy trong Inbox:** kiểm tra Spam và địa chỉ người nhận; phản hồi SMTP không xác nhận giao hàng cuối cùng.
- **Migration email còn Pending:** đây là trạng thái dự kiến cho migration mới; xem `migrate --pretend`, rồi đợi phê duyệt riêng trước khi áp dụng trên MySQL Laragon.
- **PDF không hiển thị tiếng Việt:** giữ font DejaVu Sans mặc định của PDF, không bật tải font/ảnh từ URL bên ngoài.

## Tự kiểm tra

Trong `backend`: `php artisan test --compact`, `composer audit --locked`, `php artisan commerce:check-vnpay`. Trong `frontend`: `npm test`, `npm run lint`, `npm run build`. Kiểm tra SMTP thật cần một lần gửi có chủ đích đến email do bạn kiểm soát. Kiểm tra VNPay cần merchant sandbox, HTTPS public host và xác nhận thủ công ở merchant portal; bộ test tự động không gọi VNPay, SMTP thật hoặc thanh toán ngân hàng.

### Smoke test thủ công

1. **SMTP:** chạy lệnh gửi thư kiểm tra ở trên và kiểm tra Inbox/Spam của email do bạn sở hữu.
2. **Quên mật khẩu:** mở `/forgot-password`, xin mã cho email của bạn, nhập OTP mới nhận tại `/reset-password`, đặt mật khẩu mới và đăng nhập lại. Không dán OTP vào log hoặc ticket.
3. **COD Demo:** tạo đơn thử nghiệm bằng COD, xác nhận trạng thái ghi Demo, nhận email theo trạng thái xác minh của email và tải PDF từ `/account/orders/{id}`. Trong Admin, kiểm tra trạng thái email/PDF ở `/admin/orders/{id}` và tải CSV từ `/admin/orders`.
4. **VNPay Sandbox thành công/thất bại:** chỉ sau khi dùng merchant credentials đã xoay vòng, xác nhận merchant URL và HTTPS callback, thực hiện kịch bản Sandbox được merchant cho phép. Kiểm tra IPN, trạng thái đơn từ API sau Return, email/thông báo và PDF. Thử hủy/thất bại riêng; không dùng thẻ ngân hàng thật.
5. **Gọi lại callback:** chỉ dùng chữ ký và dữ liệu thử nghiệm hợp lệ trong môi trường Sandbox; gửi lại IPN cùng giao dịch và xác nhận không phát sinh trạng thái/thông báo gửi trùng.

Hiện chưa xác nhận được một giao dịch Sandbox thật hoặc giao thư SMTP thật trong phiên này: cần merchant Sandbox đang hoạt động, secret mới sau khi xoay vòng, hostname HTTPS được VNPay chấp thuận và SMTP App Password do chủ dự án tự nhập vào `.env`.
