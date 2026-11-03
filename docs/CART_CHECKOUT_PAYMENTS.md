# Giỏ hàng, đặt hàng và thanh toán

## Chuẩn bị trên máy local

Trong `backend`, migration `2026_11_03_000001_add_payment_reconciliation_metadata` thêm bốn cột nullable vào `payment_attempts`, cờ `orders.payment_review_required` mặc định false và bảng nhật ký `payment_reconciliation_events`; dữ liệu cũ được giữ nguyên. Migration đã chạy trên MySQL Laragon của máy phát triển ngày 03/11/2026 và `migrate:status` báo `Ran`. Khi cài trên máy khác, sao lưu database, xem `php artisan migrate:status` và `php artisan migrate --pretend` trước khi chạy `php artisan migrate`. Không dùng `migrate:fresh`, `migrate:refresh` hoặc seed hàng loạt với dữ liệu đang dùng.

`COD_DEMO_ENABLED=true` chỉ dùng khi `APP_ENV=local` hoặc `testing`. COD mô phỏng tạo `payment_status=demo_paid` ngay, nhưng **không có tiền thực nhận** và xử lý giao hàng vẫn là `pending`. `ORDER_EMAIL_ENABLED` mặc định tắt; khi bật và SMTP hợp lệ, chỉ email đã xác minh nhận thông báo, lỗi gửi thư không làm mất đơn.

Giỏ khách chỉ lưu ID và số lượng trong localStorage, khi đăng nhập sẽ gộp vào giỏ máy chủ. **Mua ngay** dùng `buy_now_product_id` và `buy_now_quantity` (1–20) riêng, không thêm hay xóa sản phẩm trong giỏ. Tải lại trang hoặc đăng nhập vẫn giữ ID/số lượng trong URL checkout; backend luôn kiểm tra lại sản phẩm, kho và giá. Đặt hàng từ giỏ chỉ xóa các dòng đã mua sau khi tạo đơn thành công. `idempotency_key` UUID giữ một yêu cầu lặp lại không tạo thêm đơn.

## Tiền, tồn kho và trạng thái

Giá được tính lại trên máy chủ từ giá khuyến mãi hợp lệ, làm tròn VND với phần lẻ từ 0,50 đồng làm tròn lên. VNPay chỉ nhận tổng **5.000–9.999.999.999 VND**; `vnp_Amount` bằng tổng VND × 100 và tối đa 12 chữ số. Kho theo dõi bị trừ khi tạo đơn; `NULL` là không theo dõi. COD demo hủy khi còn chờ xử lý hoàn kho đúng một lần. Phí giao hàng demo hiện là 0 đồng, không phải báo giá vận chuyển thực.

`orders.status` là tình trạng giao hàng, tách khỏi `payment_status`:

| Thanh toán | Ý nghĩa |
| --- | --- |
| `demo_paid` | COD mô phỏng, chưa thu tiền thực |
| `pending` | VNPay chưa được xác nhận |
| `failed` | IPN/QueryDr xác thực cho biết giao dịch thất bại; kho vẫn được giữ để khách có thể thử lại |
| `needs_review` | Kết quả mơ hồ, đảo giao dịch, gian lận nghi vấn, URL cũ hoặc IPN muộn; không coi là thành công/thất bại |
| `paid` | IPN hoặc QueryDr hợp lệ đã xác nhận tiền VNPay |

Đóng trình duyệt, không có Return/IPN, hoặc URL hết hạn **không chứng minh giao dịch thất bại** và không tự hoàn kho. Khi URL hết hạn, retry truy vấn QueryDr trước. Nếu QueryDr xác nhận thất bại mới tạo tham chiếu và URL mới; nếu chưa chắc chắn, retry bị chặn và Admin thấy `needs_review`. Giao dịch cũ trước migration có `pay_created_at=NULL` không được đoán thời gian gốc; phải xem xét thủ công. Admin chỉ có thể đóng đơn chưa thanh toán và hoàn kho khi **mọi lần thanh toán đều đã xác nhận thất bại**, kèm lý do và ô xác nhận. IPN thành công đến muộn sau khi đóng/hoàn kho sẽ chuyển sang `needs_review`, không tự ghi `paid` hoặc bán vượt kho; cần kiểm tra/hoàn tiền thủ công với VNPay.

Nếu đơn đã được ghi `paid` nhưng có một giao dịch thành công khác hoặc mã giao dịch mâu thuẫn, hệ thống giữ `paid` cho lần đã xác nhận và bật `payment_review_required`. Bộ lọc **Cần đối soát** trên Admin vẫn hiển thị đơn này để xử lý khả năng thu hai lần; không tự hoàn tiền.

## VNPay Sandbox và QueryDr

Chỉ dùng thông tin merchant **sandbox** do bạn sở hữu trong `backend/.env`:

```dotenv
VNPAY_ENABLED=false
VNPAY_ENV=sandbox
VNPAY_TMN_CODE=your-sandbox-code
VNPAY_HASH_SECRET=your-sandbox-secret
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://your-test-shop.example/payment-result
VNPAY_IPN_URL=https://your-test-api.example/api/payments/vnpay/ipn
VNPAY_QUERY_ENABLED=false
VNPAY_QUERY_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
VNPAY_QUERY_IP=your-server-egress-ip
```

`VNPAY_QUERY_ENABLED=true` chỉ khi merchant được cấp QueryDr và IP máy chủ phù hợp quy định của VNPay. Mã TMN, secret, Return URL HTTPS, IPN URL HTTPS công khai phải cùng cấu hình merchant; localhost không nhận IPN trực tiếp. Có thể cần tunnel/host thử nghiệm HTTPS, whitelist merchant/IP từ nhà cung cấp. Thiếu bất kỳ điều kiện nào thì QueryDr thất bại an toàn, trạng thái cần xem xét thủ công; không có đường tắt đánh dấu đã thu tiền. Không đưa secret, mã OTP, cookie hoặc dữ liệu địa chỉ vào Git/log/frontend.

PAY URL và IPN dùng HMAC-SHA512 trên tham số URL đã sắp xếp. QueryDr là JSON POST đến endpoint sandbox cố định, chữ ký **nối các trường bằng dấu `|` theo thứ tự do VNPay quy định**; response cũng có thứ tự checksum riêng. `vnp_TransactionDate` lấy từ `pay_created_at` gốc GMT+7, không lấy giờ đối soát. Mỗi QueryDr có RequestId mới. HTTP có timeout và không theo redirect. Hệ thống kiểm tra checksum, merchant, tham chiếu, số tiền, loại giao dịch và trạng thái trước khi ghi. `vnp_ResponseCode=00` chỉ có nghĩa truy vấn API thành công; **chỉ `vnp_TransactionStatus=00` hợp lệ mới là thanh toán thành công**. Mã `91`, timeout, `01`, `04`, `07` hoặc response lỗi không giải phóng kho. Return ở trình duyệt chỉ hiển thị trạng thái của đơn thuộc người đăng nhập, không thay đổi thanh toán.

Tài liệu gốc: [VNPay QueryDr](https://sandbox.vnpayment.vn/apis/docs/truy-van-hoan-tien/querydr%26refund.html), [PAY/IPN](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html), [FAQ về mức tiền và Return/IPN](https://sandbox.vnpayment.vn/apis/docs/faqs/).

## Vận hành đối soát

- Admin đã đăng nhập mở `/admin/orders`, lọc **Cần đối soát**, vào chi tiết đơn để xem các lần thanh toán, mốc hết hạn, lần kiểm tra gần nhất và nhật ký. Nút **Đối soát QueryDr** gửi yêu cầu từ backend với quyền admin và giới hạn tốc độ.
- Trong `backend`, lệnh `php artisan commerce:reconcile-pending --limit=20` **chỉ xem trước**, không gọi mạng/ghi database. Thêm `--order-id=123` để giới hạn một đơn. Khi đã kiểm tra cấu hình, dùng `php artisan commerce:reconcile-pending --execute --limit=20` để đối soát các lần quá hạn; lệnh giãn cách các yêu cầu. Không có cron mặc định.
- Nếu chưa có QueryDr, liên hệ nhà cung cấp/kiểm tra merchant portal và bản ghi ngân hàng theo quy trình nội bộ. Không suy đoán thanh toán từ ảnh chụp màn hình, Return URL hay mã lỗi API `91`. Khi mọi attempt đã được xác nhận thất bại, Admin có thể nhập lý do, tích xác nhận và đóng đơn; thao tác được ghi nhật ký và hoàn kho đúng một lần.

API chính: `GET /api/payments/vnpay/ipn` nhận callback có chữ ký; `GET /api/payments/vnpay/return` yêu cầu đăng nhập và chỉ xác thực Return cho chủ đơn; `POST /api/admin/orders/{id}/reconcile-payment` và `POST /api/admin/orders/{id}/close-unpaid` yêu cầu quyền admin. Không có endpoint công khai ép thanh toán thành công.

## Kiểm tra an toàn

Các bài test PHP dùng SQLite `:memory:`, `Http::fake` cho QueryDr và dữ liệu tổng hợp. Không có lời gọi sandbox, ngân hàng, SMTP hoặc MySQL Laragon trong test. Sau migration được duyệt, thử trên dữ liệu test riêng: giỏ khách → đăng nhập/gộp giỏ; COD mô phỏng → đơn và thông báo; Mua ngay khi giỏ đã có 5 sản phẩm → đặt 1, giỏ còn 5; VNPay dưới 5.000 đồng bị từ chối; URL hết hạn → QueryDr/đối soát; trả về chỉ hiển thị kết quả đã xác nhận. Kiểm tra ở 390, 768, 1024 và 1440 px, bàn phím và hộp thoại địa chỉ. Không dùng thẻ hoặc tiền thật.

Chưa chạy Playwright E2E với môi trường thử nghiệm tách biệt; quy trình trên là QA thủ công. Khóa dòng giúp ngăn thao tác trùng trên MySQL/InnoDB, nhưng các race condition giữa IPN, đối soát và Admin đóng đơn vẫn cần thử thêm trên môi trường MySQL riêng trước khi vận hành thật.
