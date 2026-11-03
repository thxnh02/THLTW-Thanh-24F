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
QUEUE_CONNECTION=database
ORDER_EMAIL_MAX_ATTEMPTS=3
ORDER_EMAIL_BACKOFF_SECONDS=60,300,900
ORDER_EMAIL_STALE_AFTER_SECONDS=300
```

Chạy `php artisan config:clear`, rồi `php artisan commerce:check-mail` để kiểm tra cấu hình mà không gửi thư hoặc in email/mật khẩu. `php artisan commerce:mail-test <your-email>` gửi đúng một thư thử tới hộp thư bạn kiểm soát; chỉ chạy trong `local`/`testing`. Phản hồi thành công chỉ có nghĩa SMTP đã nhận thư, không xác nhận thư đã vào Inbox.

Thông báo đơn hàng được ghi trước trong `customer_notifications`, sau commit mới xếp `DeliverOrderNotificationEmail` vào database queue `order-emails`. Job chỉ mang ID thông báo, nạp đơn hiện tại trong worker, khóa dòng khi nhận việc, rồi lưu trạng thái gửi. SMTP không chạy trong checkout, cập nhật đơn hay VNPay IPN. Nếu queue table hoặc database queue tạm thời không sẵn sàng, đơn vẫn được giữ; notification giữ trạng thái pending để command thử xếp lại. Cần database queue migration và worker hoạt động thì email mới được gửi.

Mở terminal riêng trong `backend` để chạy worker trên Windows/Laragon:

```powershell
php artisan queue:work database --queue=order-emails --sleep=3 --tries=1 --timeout=30
```

Giữ terminal này mở khi phát triển. `ORDER_EMAIL_MAX_ATTEMPTS` mặc định là 3; backoff retry mặc định 60, 300 và 900 giây. Một worker dừng sau khi SMTP nhận thư nhưng trước khi trạng thái `sent` được ghi vẫn có thể dẫn tới gửi lặp; SMTP không cung cấp bảo đảm exactly-once. Không ghi nội dung mail, OTP hay thông tin nhạy cảm vào log.

Admin có thể dò notification chưa thử, email lỗi đã tới hạn và lần thử bị kẹt hơn 5 phút bằng lệnh mặc định chỉ xem trước:

```powershell
php artisan commerce:retry-order-emails --limit=20
```

Sau khi kiểm tra cấu hình SMTP và worker, thêm `--execute` để xếp các notification tới hạn vào queue:

```powershell
php artisan commerce:retry-order-emails --execute --limit=20
```

Đơn vẫn sử dụng được nếu worker đang tắt; notification chưa gửi sẽ còn trong bảng để xử lý khi worker chạy lại. Mỗi order detail trong Admin cũng cho biết trạng thái email khách/admin và số lần thử. Tài khoản chưa xác minh chỉ nhận thư chung cho đơn mới, không gồm mã đơn, sản phẩm, địa chỉ, số điện thoại hay tổng chi tiết. Tài khoản đã xác minh có thể nhận nội dung đơn. Password reset OTP vẫn gửi qua SMTP thật khi người dùng yêu cầu; không tự gửi thư trong test.

## Trạng thái migration email và queue

Đã kiểm tra database MySQL Laragon trên máy này: các migration `2026_11_03_000001` đến `2026_11_03_000003` đều là `Ran`; migration `000003` tạo bảng `jobs` và `failed_jobs` mà không xóa dữ liệu. Trạng thái chỉ áp dụng cho máy này; kiểm tra lại trên máy khác trước khi cài.

Xem trạng thái và SQL dự kiến trước khi cài:

```powershell
php artisan migrate:status
php artisan migrate --pretend
```

Migration queue đã được xem trước bằng `migrate --pretend` và áp dụng theo xác nhận của chủ dự án trên MySQL Laragon. Migration chỉ tạo bảng queue còn thiếu; không chạy `migrate:fresh`, `migrate:refresh`, `db:wipe`, seed phá hủy dữ liệu hoặc rollback. Trên môi trường khác, sao lưu database và kiểm tra `migrate:status` cùng `migrate --pretend` trước khi cài.
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
- **Email đang Pending:** xác nhận `ORDER_EMAIL_ENABLED=true`, bảng queue đã được tạo và worker `queue:work database --queue=order-emails` đang chạy. Dùng `commerce:retry-order-emails` để xem trước các thư chưa gửi; chỉ thêm `--execute` khi muốn xếp chúng lại vào hàng đợi.
- **PDF không hiển thị tiếng Việt:** giữ font DejaVu Sans mặc định của PDF, không bật tải font/ảnh từ URL bên ngoài.

## Tự kiểm tra

Trong `backend`: `php artisan test --compact`, `composer audit --locked`, `php artisan commerce:check-vnpay`. Trong `frontend`: `npm test`, `npm run test:e2e`, `npm run lint`, `npm run build`, `npm audit`. Playwright E2E chỉ dùng API mock và không kết nối MySQL, SMTP hoặc merchant VNPay thật. Kiểm tra SMTP thật cần một lần gửi có chủ đích đến email do bạn kiểm soát. Kiểm tra VNPay cần merchant sandbox, HTTPS public host và xác nhận thủ công ở merchant portal; bộ test tự động không gọi VNPay, SMTP thật hoặc thanh toán ngân hàng.

### Smoke test thủ công

1. **SMTP:** chạy lệnh gửi thư kiểm tra ở trên và kiểm tra Inbox/Spam của email do bạn sở hữu.
2. **Quên mật khẩu:** mở `/forgot-password`, xin mã cho email của bạn, nhập OTP mới nhận tại `/reset-password`, đặt mật khẩu mới và đăng nhập lại. Không dán OTP vào log hoặc ticket.
3. **COD Demo:** tạo đơn thử nghiệm bằng COD, xác nhận trạng thái ghi Demo, nhận email theo trạng thái xác minh của email và tải PDF từ `/account/orders/{id}`. Trong Admin, kiểm tra trạng thái email/PDF ở `/admin/orders/{id}` và tải CSV từ `/admin/orders`.
4. **VNPay Sandbox thành công/thất bại:** chỉ sau khi dùng merchant credentials đã xoay vòng, xác nhận merchant URL và HTTPS callback, thực hiện kịch bản Sandbox được merchant cho phép. Kiểm tra IPN, trạng thái đơn từ API sau Return, email/thông báo và PDF. Thử hủy/thất bại riêng; không dùng thẻ ngân hàng thật.
5. **Gọi lại callback:** chỉ dùng chữ ký và dữ liệu thử nghiệm hợp lệ trong môi trường Sandbox; gửi lại IPN cùng giao dịch và xác nhận không phát sinh trạng thái/thông báo gửi trùng.

Hiện chưa xác nhận được một giao dịch Sandbox thật hoặc giao thư SMTP thật trong phiên này: cần merchant Sandbox đang hoạt động, secret mới sau khi xoay vòng, hostname HTTPS được VNPay chấp thuận và SMTP App Password do chủ dự án tự nhập vào `.env`.
