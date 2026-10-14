# Frontend architecture

Frontend dùng JavaScript/JSX, Next.js, Tailwind và Axios.

```text
Page -> service -> axios client -> Laravel API
```

- `src/config/api.js`: base URL và endpoint.
- `src/lib/axiosClient.js`: client công khai.
- `src/lib/axiosAdmin.js`: client admin, chưa có token vì phần auth chưa học.
- `src/services`: Category, Brand và Product services.
- `src/components/admin`: Header, SideBar, AdminShell, accessible table/form/status/trash primitives.
- `src/components/shop`: API-backed product/category/brand cards and image fallbacks.
- `src/app/admin`: singular category/brand/product routes for list, create, edit, trash, restore, and guarded permanent deletion.

Public product pagination reflects the selected page in `/products?page=N` and can be opened directly. Admin keeps paginated tables separate from select-option endpoints. Destructive operations require an explicit confirmation. Admin API routes currently have no authentication or authorization and are safe only for local coursework.
