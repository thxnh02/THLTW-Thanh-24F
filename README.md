# THLTW Shop Ecommerce

Project mon Thuc hanh lap trinh Web: Laravel REST API + Next.js frontend.

## Stack

- Backend: Laravel 13, PHP 8.5, MySQL/SQLite for local test
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- API prefix: `http://localhost:8000/api/v1`
- Frontend dev: `http://localhost:3000`
- Payment: COD ready, VNPay Sandbox integration configurable by env
- Auth: Laravel Sanctum SPA session/cookie flow
- Extras: media uploads, order email, printable invoices, CSV export, SEO sitemap/robots, CI

## Structure

- `backend/`: Laravel API, migrations, seeders, tests
- `frontend/`: Next.js storefront and admin screens
- `docs/`: setup, database, API, feature and testing notes

## Quick Start

Backend:

```powershell
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve --host=localhost
```

Frontend:

```powershell
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` in `frontend/.env.local`.
Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for SEO sitemap/canonical URLs.

Optional VNPay sandbox env:

```env
VNP_TMN_CODE=
VNP_HASH_SECRET=
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:8000/api/v1/vnpay/return
VNP_IPN_URL=http://localhost:8000/api/v1/vnpay/ipn
```

Demo accounts:

- Admin: `admin@example.com` / `Admin@123`
- Member: `member@example.com` / `Member@123`
