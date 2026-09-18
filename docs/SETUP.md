# Setup

## Backend

```powershell
cd backend
composer install
copy .env.example .env
php artisan key:generate
```

Configure database in `backend/.env`. For MySQL:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=thltw_shop
DB_USERNAME=root
DB_PASSWORD=
FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1,127.0.0.1:3000,127.0.0.1:8000
```

Then run:

```powershell
php artisan migrate --seed
php artisan storage:link
php artisan serve --host=localhost
```

## Frontend

```powershell
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

`frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Sanctum SPA auth uses HttpOnly Laravel session cookies. Keep `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `SANCTUM_STATEFUL_DOMAINS` and `NEXT_PUBLIC_API_URL` aligned when changing domains.

## Mail

Local email can use the log mailer:

```env
MAIL_MAILER=log
MAIL_FROM_ADDRESS=hello@example.com
MAIL_FROM_NAME="${APP_NAME}"
```

For SMTP, configure the standard Laravel `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, and encryption values in `.env`. Order confirmation and password reset flows do not require credentials in source code.

## VNPay Sandbox

COD works without extra credentials. To test VNPay, configure these in `backend/.env`:

```env
VNP_TMN_CODE=
VNP_HASH_SECRET=
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:8000/api/v1/vnpay/return
VNP_IPN_URL=http://localhost:8000/api/v1/vnpay/ipn
```
# Feature Setup Notes

- Run migrations and seeders after pulling this round so default shipping methods and return/invoice settings are available.
- Product import uses plain CSV. A sample file is available at `docs/PRODUCT_IMPORT_SAMPLE.csv` and via `/api/v1/admin/products/import/template`.
- PDF invoices are generated server-side without adding a new package; HTML invoices remain available for print-quality output.
