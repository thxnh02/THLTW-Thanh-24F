# CT_24F Frontend

Giao diện cửa hàng và trang quản trị xây dựng bằng Next.js. Cửa hàng hiển thị danh mục, thương hiệu và sản phẩm; trang quản trị hỗ trợ CRUD, phân trang và thùng rác.

## Chạy trên máy

```powershell
copy .env.example .env.local
npm install
npm run dev
```

Mở `http://127.0.0.1:3000`. Frontend dùng `NEXT_PUBLIC_API_URL` trong `.env.local` để kết nối Laravel API; nếu không khai báo, địa chỉ mặc định là `http://127.0.0.1:8000/api`.

## Kiểm tra

```powershell
npm run lint
npm run test
npm run build
```

Xem [cấu trúc frontend](../docs/FRONTEND_ARCHITECTURE.md) và [sơ đồ mã nguồn quản trị](../docs/ADMIN_CODE_GUIDE.md).
