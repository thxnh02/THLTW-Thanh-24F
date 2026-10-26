# Admin Catalog Code Guide

This guide is for the `CT_24F` project. It maps the admin UI to the Laravel API for products, categories, and brands.

## Add a product: follow the request

1. UI page: `frontend/src/app/admin/product/create/page.jsx` loads category/brand options and handles the submit result.
2. Form: `frontend/src/components/admin/ProductForm.jsx` collects fields and passes the payload to `onSubmit`.
3. Frontend API wrapper: `frontend/src/services/productServices.js` → `createProduct(data)`.
4. Endpoint constant: `frontend/src/config/api.js` → `PRODUCTS.ADMIN_STORE` (`/admin/products`).
5. Laravel route: `backend/routes/api.php` → `Route::apiResource('products', AdminProductController::class)`; POST maps to `store`.
6. Controller: `backend/app/Http/Controllers/Api/Admin/AdminProductController.php` → `store()` validates, creates the model, and returns HTTP 201.
7. Validation and response shape: `backend/app/Http/Requests/StoreProductRequest.php` and `backend/app/Http/Resources/ProductResource.php`.

The API base prefix is `/api`, so the complete create endpoint is `POST /api/admin/products`.

## Catalog page map

| Feature | Frontend page | Frontend service | API route | Backend handler |
| --- | --- | --- | --- | --- |
| Product list | `frontend/src/app/admin/product/page.jsx` | `productServices.getAdminProducts()` | `GET /api/admin/products` | `AdminProductController::index()` |
| Product create | `frontend/src/app/admin/product/create/page.jsx` | `productServices.createProduct()` | `POST /api/admin/products` | `AdminProductController::store()` |
| Product edit | `frontend/src/app/admin/product/[id]/edit/page.jsx` | `getAdminProduct()` / `updateProduct()` | `GET`, `PUT /api/admin/products/{id}` | `show()` / `update()` |
| Product soft delete | Product list + `ConfirmDialog` | `deleteProduct()` | `DELETE /api/admin/products/{id}` | `destroy()` |
| Product trash | `frontend/src/app/admin/product/trash/page.jsx` | `getProductTrash()` | `GET /api/admin/products/trash` | `trash()` |
| Product restore | Product trash page | `restoreProduct()` | `POST /api/admin/products/{id}/restore` | `restore()` |
| Product permanent delete | Product trash page | `forceDeleteProduct()` | `DELETE /api/admin/products/{id}/force` | `forceDestroy()` |
| Category CRUD/trash | `frontend/src/app/admin/category/` | `frontend/src/services/categoryServices.js` | `/api/admin/categories...` | `AdminCategoryController` |
| Brand CRUD/trash | `frontend/src/app/admin/brand/` | `frontend/src/services/brandServices.js` | `/api/admin/brands...` | `AdminBrandController` |

## Where to find validation, data, and shared UI

- Routes: `backend/routes/api.php`
- Admin controllers: `backend/app/Http/Controllers/Api/Admin/`
- Request validation: `backend/app/Http/Requests/Store*Request.php` and `Update*Request.php`
- JSON response formatting: `backend/app/Http/Resources/`
- Database models and relationships: `backend/app/Models/`
- Endpoint paths: `frontend/src/config/api.js`
- Axios wrappers: `frontend/src/lib/axiosAdmin.js` (admin) and `axiosClient.js` (storefront)
- Form components: `frontend/src/components/admin/CategoryForm.jsx`, `BrandForm.jsx`, and `ProductForm.jsx`
- Shared admin table/dialog: `frontend/src/components/admin/AdminTable.jsx`, `TrashTable.jsx`, and `ConfirmDialog.jsx`
