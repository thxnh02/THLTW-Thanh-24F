# CT_24F — Ecommerce course project

This branch is a small rebuild aligned with the current Laravel/Next.js classroom scope. It contains JSON APIs for categories, brands and a paginated public product list, plus open (no-auth-yet) admin CRUD for categories and brands.

## Stack and scope

- Laravel 13, PHP, Eloquent, FormRequest, API Resource, MySQL/MariaDB
- Next.js, React, JavaScript/JSX, Tailwind CSS and Axios
- Database: `ecommerce_thltw`
- Lecturer workflow: **Model → FormRequest → Controller → Resource → Route → Postman test**

Authentication is intentionally not implemented yet because it has not been covered in the current lecturer scope. The admin endpoints are therefore temporarily open for classroom practice only.

## Run locally (Laragon)

Create an empty MySQL database named `ecommerce_thltw`.

```powershell
cd backend
copy .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

The backend `.env.example` is already set to `127.0.0.1`, user `root`, and an empty password for a usual Laragon install.

```powershell
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

`NEXT_PUBLIC_API_URL` defaults to `http://127.0.0.1:8000/api`.

## Routes

Public API:

- `GET /api/categories`
- `GET /api/categories/{slug}`
- `GET /api/brands`
- `GET /api/products`
- `GET /api/products?page=2` (exactly 12 products per page)

Admin API: `GET`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}` for both `/api/admin/categories` and `/api/admin/brands`.

Frontend routes: `/`, `/categories`, `/brands`, `/products`, `/admin`, `/admin/category`, `/admin/brand` and their create/edit pages.

## Structure

- `backend/app/Models`: Category, Brand, Product
- `backend/app/Http/Requests`: category/brand create and update validation
- `backend/app/Http/Controllers/Api`: public and admin controllers
- `backend/app/Http/Resources`: controlled JSON response shapes
- `frontend/src/config/api.js`: endpoint configuration
- `frontend/src/lib`: public/admin Axios clients
- `frontend/src/services`: Category, Brand and Product services
- `frontend/src/components/admin`: Header, SideBar, AdminTable and simple forms

## Not implemented yet

Login, roles, user management, cart, checkout, orders, payments, VNPay, wishlist, reviews, inventory, reports, product administration, variants, media management, promotions and all other advanced ecommerce modules are intentionally out of scope.

See [API testing notes](docs/API_TEST.md) for Postman examples. Always send `Accept: application/json`.
