# Kiểm tra tài khoản sau cập nhật

## Đã kiểm tra tự động

- API địa chỉ: thêm, sửa, xóa, phân quyền sở hữu, giới hạn 10, chuyển mặc định ngay khi thêm/sửa, giữ quận/huyện cũ.
- Form địa chỉ: nút Hủy không gửi form; chọn tỉnh làm thay đổi danh sách gợi ý xã/phường; đổi tỉnh chỉ xóa xã/phường sau khi đồng ý.
- Bản dữ liệu địa giới cục bộ: 34 tỉnh và 3.321 đơn vị cấp xã, mã duy nhất.
- API ảnh: từ chối tệp giả, quá 2 MB hoặc kích thước quá 4096 pixel mỗi chiều / 12 triệu pixel.

## Kiểm tra thủ công trên trình duyệt

1. Mở `/account/addresses` ở 390, 768, 1024 và 1440 px. Thử thêm địa chỉ, cuộn tới nút Lưu khi bàn phím điện thoại hiện, bấm Hủy, Escape và vùng phủ; xác nhận không gửi dữ liệu. Khi đang lưu, Hủy và đóng phải bị khóa.
2. Chọn tỉnh rồi xã/phường; thử tên địa danh không có trong danh sách để dùng nhập tay. Sửa địa chỉ cũ có quận/huyện; đổi tỉnh và từ chối/xác nhận xóa xã cũ.
3. Tạo ít nhất hai địa chỉ, đặt địa chỉ thứ hai mặc định trong form, sau đó xóa địa chỉ mặc định. Kiểm tra huy hiệu mặc định mới.
4. Đổi ảnh đại diện, thử ảnh quá lớn, xóa ảnh; kiểm tra tên/số điện thoại chưa lưu vẫn còn sau khi ảnh làm mới header.
5. Đổi mật khẩu; kiểm tra thông báo đăng nhập lại trước chuyển trang. Với phiên hết hạn, kiểm tra thông báo và chuyển tới đăng nhập. Mở menu tài khoản trên desktop, thử click ngoài và Escape.

Các kiểm tra trong tài liệu này áp dụng cho lần cập nhật hồ sơ/địa chỉ trước đây. Tính năng mua hàng hiện có migration bổ sung; xem [CART_CHECKOUT_PAYMENTS.md](CART_CHECKOUT_PAYMENTS.md). Test tự động dùng SQLite riêng và không gửi email. Chưa kiểm tra trực tiếp MySQL, SMTP thật, thiết bị di động thật, ảnh EXIF hoặc tốc độ đường truyền chậm. Ảnh đại diện hiện lưu nguyên tệp JPEG/PNG/WebP sau khi kiểm tra MIME, dung lượng và số pixel; máy PHP chưa có thư viện giải mã/ghi lại ảnh nên metadata chưa được loại bỏ.

## Cập nhật bảo vệ quản trị

Nhóm route `/api/admin/*` nay đã có xác thực và phân quyền admin. Xem [ADMIN_AUTH.md](ADMIN_AUTH.md) để thiết lập tài khoản mẫu local và kiểm tra đăng nhập.
