# Dữ liệu chọn địa chỉ Việt Nam

Form địa chỉ dùng bản sao cục bộ `frontend/src/data/vietnam-administrative-2025.json`: 34 tỉnh/thành phố và 3.321 xã/phường/đặc khu, theo mô hình hai cấp có hiệu lực từ 01/07/2025. Form vẫn cho nhập tay khi dữ liệu không khớp hoặc cần giữ địa chỉ cũ; mã địa giới chỉ được gửi khi tên được chọn khớp bản dữ liệu.

- Văn bản gốc: [Quyết định 19/2025/QĐ-TTg](https://vanban.chinhphu.vn/?classid=1&docid=214409&orggroupid=3&pageid=27160).
- Bản dữ liệu JSON: [Open Admin Data](https://github.com/open-admin-data/vietnam-administrative-divisions/blob/37ec5e10a97f846641cf862a846cd6757dd24f25/data/hierarchy.json), commit `37ec5e10a97f846641cf862a846cd6757dd24f25`, giấy phép CC BY 4.0. Các trường được giữ lại: mã và tên tỉnh, mã và tên xã.
- Đã kiểm tra số lượng và mã không trùng bằng `frontend/tests/vietnam-address-data.test.js`. Đây là dữ liệu cộng đồng tổng hợp từ quyết định, không phải API chính phủ. Khi có quyết định điều chỉnh, đối chiếu phụ lục chính thức rồi cập nhật file và test. Không tự đổi địa chỉ người dùng đã lưu.

Việc chọn tỉnh/xã không cần mạng. Danh sách gợi ý dùng `datalist` của trình duyệt; nếu trình duyệt không hỗ trợ tốt, người dùng vẫn nhập tên thủ công được.
