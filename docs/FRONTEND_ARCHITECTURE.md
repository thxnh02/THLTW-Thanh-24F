# Frontend architecture

Frontend dùng JavaScript/JSX, Next.js, Tailwind và Axios.

```text
Page -> service -> axios client -> Laravel API
```

- `src/config/api.js`: base URL và endpoint.
- `src/lib/axiosClient.js`: client công khai.
- `src/lib/axiosAdmin.js`: client dùng cho API quản trị; hiện chưa có cơ chế xác thực.
- `src/services`: Category, Brand và Product services.
- `src/components/admin`: bố cục quản trị, bảng, biểu mẫu và hộp thoại xác nhận.

Danh mục, thương hiệu và sản phẩm đều có trang danh sách, thêm, sửa và thùng rác. Thao tác xóa trong danh sách mở hộp thoại xác nhận; thùng rác hỗ trợ chọn nhiều mục để khôi phục hoặc xóa vĩnh viễn.
