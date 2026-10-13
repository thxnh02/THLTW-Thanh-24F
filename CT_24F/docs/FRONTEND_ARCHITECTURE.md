# Frontend architecture

Frontend dùng JavaScript/JSX, Next.js, Tailwind và Axios.

```text
Page -> service -> axios client -> Laravel API
```

- `src/config/api.js`: base URL và endpoint.
- `src/lib/axiosClient.js`: client công khai.
- `src/lib/axiosAdmin.js`: client admin, chưa có token vì phần auth chưa học.
- `src/services`: Category, Brand và Product services.
- `src/components/admin`: Header, SideBar, AdminTable, CategoryForm, BrandForm.

Danh mục và thương hiệu đều có trang list, create, edit và delete riêng. Trang list chỉ điều hướng sang trang delete, không gọi API xóa trực tiếp.
